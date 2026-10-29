// Real pg clients are captured only in this test harness, to probe the same connection
// without a tenant after commit/rollback. The public handle deliberately has no such API.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { sql } from "kysely";
import type * as Pg from "pg";
import { createDatabase, runMigrations, TenantContext, withTenant } from "../src/index.ts";
import type { Database } from "../src/index.ts";
import { localRoleUrl, setLocalDevPasswords } from "../src/local.ts";
import { TEST_URL, createScratchDatabase, withClient } from "./support.ts";
import type { ScratchDatabase } from "./support.ts";

const captured = vi.hoisted(() => ({ clients: [] as Pg.Client[] }));
vi.mock("pg", async (importOriginal) => {
  const actual = await importOriginal<typeof Pg>();
  return {
    ...actual,
    Client: class extends actual.Client {
      constructor(...args: ConstructorParameters<typeof actual.Client>) {
        super(...args);
        captured.clients.push(this);
      }
    },
  };
});

interface ProbeDB {
  "app.tenant_probe": { id: string; organization_id: string };
}
const orgA = randomUUID();
const orgB = randomUUID();
const membershipId = randomUUID();
const context = (organizationId: string, audit = false) =>
  TenantContext.fromVerifiedMembership({
    organizationId,
    ...(audit ? { membershipId } : {}),
  });

describe.skipIf(TEST_URL === "")("Kysely tenant transactions (Postgres)", () => {
  let scratch: ScratchDatabase;
  let db: Database<ProbeDB>;
  let raw: Pg.Client;

  beforeAll(async () => {
    scratch = await createScratchDatabase();
    await runMigrations({ connectionString: scratch.url });
    await setLocalDevPasswords(scratch.url);
    await withClient(scratch.url, (admin) =>
      admin.query(`
      SET ROLE ts_owner;
      CREATE TABLE app.tenant_probe (id uuid PRIMARY KEY, organization_id uuid NOT NULL);
      ALTER TABLE app.tenant_probe ENABLE ROW LEVEL SECURITY;
      ALTER TABLE app.tenant_probe FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_scope ON app.tenant_probe FOR ALL
        USING (organization_id = app.current_organization_id())
        WITH CHECK (organization_id = app.current_organization_id());
      RESET ROLE;`),
    );
    db = createDatabase<ProbeDB>(localRoleUrl(scratch.url, "ts_app"));
    await withTenant(db, context(orgA), async (trx) => {
      await trx.insertInto("app.tenant_probe").values({ id: orgA, organization_id: orgA }).execute();
    });
    const client = captured.clients.at(-1);
    if (client === undefined) throw new Error("Expected the request client");
    raw = client;
    await withTenant(db, context(orgB), async (trx) => {
      await trx.insertInto("app.tenant_probe").values({ id: orgB, organization_id: orgB }).execute();
    });
  });

  afterAll(async () => {
    await db?.close();
    await scratch?.drop();
  });

  const expectNoContext = async () => {
    await raw.query("BEGIN");
    try {
      expect((await raw.query("SELECT * FROM app.tenant_probe")).rows).toEqual([]);
      expect(
        (
          await raw.query(`SELECT app.current_organization_id() AS organization,
        NULLIF(current_setting('app.membership_id', true), '') AS membership`)
        ).rows,
      ).toEqual([{ organization: null, membership: null }]);
    } finally {
      await raw.query("ROLLBACK");
    }
  };

  it("isolates two parallel request handles and queued transactions over 50 repetitions", async () => {
    const other = createDatabase<ProbeDB>(localRoleUrl(scratch.url, "ts_app"));
    const handles = [db, other];
    const check = (handle: Database<ProbeDB>, org: string) =>
      withTenant(handle, context(org), async (trx) => {
        const rows = await trx.selectFrom("app.tenant_probe").selectAll().execute();
        expect(rows).toEqual([{ id: org, organization_id: org }]);
        await sql`SELECT pg_sleep(0.001)`.execute(trx);
        expect(await trx.selectFrom("app.tenant_probe").selectAll().execute()).toEqual(rows);
      });
    try {
      for (let i = 0; i < 50; i++) {
        // Exercise both physical clients and contention on each handle; alternate tenants.
        // oxlint-disable-next-line no-await-in-loop
        await Promise.all(handles.flatMap((handle) => [check(handle, orgA), check(handle, orgB)]));
      }
    } finally {
      await other.close();
    }
  });

  it("clears organization and audit membership on commit on the very same connection", async () => {
    await withTenant(db, context(orgA, true), async (trx) => {
      const { rows } = await sql<{
        membership: string;
      }>`SELECT current_setting('app.membership_id') AS membership`.execute(trx);
      expect(rows).toEqual([{ membership: membershipId }]);
    });
    await expectNoContext();
    await withTenant(db, context(orgB), async (trx) => {
      const { rows } = await sql<{
        membership: string | null;
      }>`SELECT NULLIF(current_setting('app.membership_id', true), '') AS membership`.execute(trx);
      expect(rows).toEqual([{ membership: null }]);
    });
  });

  it("rolls back writes and clears both identifiers when the callback throws", async () => {
    const id = randomUUID();
    const failure = new Error("synthetic callback failure");
    await expect(
      withTenant(db, context(orgA, true), async (trx) => {
        await trx.insertInto("app.tenant_probe").values({ id, organization_id: orgA }).execute();
        throw failure;
      }),
    ).rejects.toBe(failure);
    await expectNoContext();
    await withTenant(db, context(orgA), async (trx) => {
      expect(await trx.selectFrom("app.tenant_probe").selectAll().where("id", "=", id).execute()).toEqual([]);
    });
  });

  it("rolls back after a database error and rejects writes for another organization", async () => {
    await expect(
      withTenant(db, context(orgA), (trx) =>
        trx.insertInto("app.tenant_probe").values({ id: randomUUID(), organization_id: orgB }).execute(),
      ),
    ).rejects.toThrow(/row-level security/);
    await expectNoContext();
  });

  it("rejects a non-UUID tenant before the callback", () => {
    expect(() => context("not-a-uuid")).toThrow("Invalid tenant context");
  });
  // ADR 0007 §3 test 3 (NOBYPASSRLS, DISABLE RLS, SET ROLE) is covered in roles.integration.test.ts.
});
