// Issue #54 acceptance: least-privilege roles and tenant context, against real Postgres
// with the shipped migrations. Uses only synthetic data.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { runMigrations } from "../src/index.ts";
import { localRoleUrl, setLocalDevPasswords } from "../src/local.ts";
import { TEST_URL, createScratchDatabase, withClient } from "./support.ts";
import type { ScratchDatabase } from "./support.ts";

describe.skipIf(TEST_URL === "")("roles and tenant context (Postgres)", () => {
  let db: ScratchDatabase;
  let app: Client;
  const admin = <T extends object>(sql: string, params: unknown[] = []) =>
    withClient(db.url, (c) => c.query<T & Record<string, unknown>>(sql, params));

  beforeAll(async () => {
    db = await createScratchDatabase();
    await runMigrations({ connectionString: db.url });
    await setLocalDevPasswords(db.url);
    // Synthetic RLS table owned by ts_owner, as later migrations will create them.
    await admin(`
      SET ROLE ts_owner;
      CREATE TABLE app.rls_probe (id int PRIMARY KEY, organization_id uuid NOT NULL);
      ALTER TABLE app.rls_probe ENABLE ROW LEVEL SECURITY;
      ALTER TABLE app.rls_probe FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_scope ON app.rls_probe FOR ALL
        USING (organization_id = app.current_organization_id())
        WITH CHECK (organization_id = app.current_organization_id());
      RESET ROLE;`);
    app = new Client({ connectionString: localRoleUrl(db.url, "ts_app") });
    await app.connect();
  });

  afterAll(async () => {
    await app?.end();
    await db?.drop();
  });

  it("second run of the shipped migrations is a no-op", async () => {
    expect((await runMigrations({ connectionString: db.url })).applied).toEqual([]);
  });

  it.each(["ts_app", "ts_auth"])("%s has no elevated attributes or memberships", async (role) => {
    const { rows } = await admin(
      `SELECT rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolinherit, rolcanlogin,
              (SELECT count(*)::int FROM pg_auth_members m WHERE m.member = r.oid) AS memberships
         FROM pg_roles r WHERE rolname = $1`,
      [role],
    );
    expect(rows[0]).toEqual({
      rolsuper: false,
      rolbypassrls: false,
      rolcreaterole: false,
      rolcreatedb: false,
      rolinherit: false,
      rolcanlogin: true,
      memberships: 0,
    });
  });

  it("ts_owner cannot log in and owns the schemas and objects", async () => {
    const { rows } = await admin(
      `SELECT (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'ts_owner') AS can_login,
              (SELECT array_agg(DISTINCT pg_get_userbyid(nspowner)::text) FROM pg_namespace
                WHERE nspname IN ('app', 'auth')) AS schema_owners,
              (SELECT pg_get_userbyid(proowner) FROM pg_proc
                WHERE oid = 'app.current_organization_id()'::regprocedure) AS function_owner`,
    );
    expect(rows[0]).toEqual({
      can_login: false,
      schema_owners: ["ts_owner"],
      function_owner: "ts_owner",
    });
  });

  it("runtime roles own no relation", async () => {
    const { rows } = await admin(
      `SELECT count(*)::int AS n FROM pg_class
        WHERE pg_get_userbyid(relowner) IN ('ts_app', 'ts_auth')`,
    );
    expect(rows[0]).toEqual({ n: 0 });
  });

  it("ts_app cannot SET ROLE ts_owner", async () => {
    await expect(app.query("SET ROLE ts_owner")).rejects.toThrow(/permission denied/);
  });

  it("ts_app cannot create tables in app", async () => {
    await expect(app.query("CREATE TABLE app.sneaky (id int)")).rejects.toThrow(/permission denied for schema app/);
  });

  it("ts_app has no access to the auth schema; ts_auth gets nothing on new app tables", async () => {
    // ts_auth has USAGE on app for the identity tables only (ADR 0012); default privileges
    // never grant it anything, so a new domain table such as rls_probe stays closed to it.
    const { rows } = await admin(
      `SELECT has_schema_privilege('ts_app', 'auth', 'USAGE') AS app_auth,
              has_any_column_privilege('ts_auth', 'app.rls_probe', 'SELECT, INSERT, UPDATE') AS auth_probe_columns,
              has_table_privilege('ts_auth', 'app.rls_probe', 'SELECT, INSERT, UPDATE, DELETE') AS auth_probe`,
    );
    expect(rows[0]).toEqual({ app_auth: false, auth_probe_columns: false, auth_probe: false });
  });

  it("ts_app cannot disable or un-force RLS, or truncate", async () => {
    await expect(app.query("ALTER TABLE app.rls_probe DISABLE ROW LEVEL SECURITY")).rejects.toThrow(/must be owner/);
    await expect(app.query("ALTER TABLE app.rls_probe NO FORCE ROW LEVEL SECURITY")).rejects.toThrow(/must be owner/);
    await expect(app.query("TRUNCATE app.rls_probe")).rejects.toThrow(/permission denied/);
  });

  it("ts_app gets role-level timeouts", async () => {
    const { rows } = await app.query(
      `SELECT current_setting('statement_timeout') AS statement,
              current_setting('lock_timeout') AS lock,
              current_setting('idle_in_transaction_session_timeout') AS idle`,
    );
    expect(rows[0]).toEqual({ statement: "15s", lock: "5s", idle: "15s" });
  });

  it("current_organization_id() is NULL without context and transaction-local with set_config", async () => {
    const current = async () =>
      (await app.query<{ id: string | null }>("SELECT app.current_organization_id() AS id")).rows[0]?.id;
    const org = randomUUID();

    expect(await current()).toBeNull();
    await app.query("BEGIN");
    await app.query("SELECT set_config('app.organization_id', $1, true)", [org]);
    expect(await current()).toBe(org);
    await app.query("COMMIT");
    expect(await current()).toBeNull();

    await app.query("BEGIN");
    await app.query("SELECT set_config('app.organization_id', $1, true)", [org]);
    await app.query("ROLLBACK");
    expect(await current()).toBeNull();
  });

  it("RLS scopes ts_app to the organization in context and fails closed without one", async () => {
    const [orgA, orgB] = [randomUUID(), randomUUID()];
    const inTenant = async (org: string, sql: string) => {
      await app.query("BEGIN");
      try {
        await app.query("SELECT set_config('app.organization_id', $1, true)", [org]);
        const result = await app.query(sql);
        await app.query("COMMIT");
        return result.rows;
      } catch (error) {
        await app.query("ROLLBACK");
        throw error;
      }
    };
    await inTenant(orgA, `INSERT INTO app.rls_probe VALUES (1, '${orgA}')`);
    await inTenant(orgB, `INSERT INTO app.rls_probe VALUES (2, '${orgB}')`);
    await expect(inTenant(orgA, `INSERT INTO app.rls_probe VALUES (3, '${orgB}')`)).rejects.toThrow(
      /row-level security/,
    );

    expect(await inTenant(orgA, "SELECT id FROM app.rls_probe")).toEqual([{ id: 1 }]);
    expect((await app.query("SELECT id FROM app.rls_probe")).rows).toEqual([]);
  });
});
