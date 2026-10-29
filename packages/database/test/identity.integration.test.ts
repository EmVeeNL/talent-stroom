// Issue #55 acceptance: identity and tenancy schema (ADR 0012) against real Postgres with the
// shipped migrations. Uses only synthetic data.
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { runMigrations } from "../src/index.ts";
import { localRoleUrl, setLocalDevPasswords } from "../src/local.ts";
import { TEST_URL, createScratchDatabase, withClient } from "./support.ts";
import type { ScratchDatabase } from "./support.ts";

const AUTH_TABLES = [
  "users",
  "sessions",
  "auth_accounts",
  "auth_verifications",
  "auth_passkeys",
  "auth_two_factors",
  "auth_rate_limits",
  "auth_security_events",
];
const APP_IDENTITY_TABLES = ["organizations", "memberships", "organization_invitations"];

describe.skipIf(TEST_URL === "")("identity schema (Postgres)", () => {
  let db: ScratchDatabase;
  let app: Client;
  let auth: Client;
  let firstRun: string[];
  const admin = <T extends object>(sql: string, params: unknown[] = []) =>
    withClient(db.url, (c) => c.query<T & Record<string, unknown>>(sql, params));

  const [orgA, orgB] = [randomUUID(), randomUUID()];
  const [userA, userB] = [randomUUID(), randomUUID()];
  const [memberA, memberB] = [randomUUID(), randomUUID()];

  /** Runs `fn` as ts_app inside a transaction bound to `org`, always rolling back. */
  const asTenant = async <T>(org: string | null, fn: () => Promise<T>): Promise<T> => {
    await app.query("BEGIN");
    try {
      if (org !== null) await app.query("SELECT set_config('app.organization_id', $1, true)", [org]);
      return await fn();
    } finally {
      await app.query("ROLLBACK");
    }
  };

  /** Membership and organization ids visible to ts_app. */
  const readIdentityRows = async () => {
    const memberships = await app.query<{ id: string }>("SELECT id FROM app.memberships ORDER BY id");
    const organizations = await app.query<{ id: string }>("SELECT id FROM app.organizations ORDER BY id");
    return { memberships: memberships.rows.map((r) => r.id), organizations: organizations.rows.map((r) => r.id) };
  };

  /** Runs `sql` as ts_auth in a transaction that is always rolled back. */
  const authTry = async (sql: string, params: unknown[] = []) => {
    await auth.query("BEGIN");
    try {
      return await auth.query(sql, params);
    } finally {
      await auth.query("ROLLBACK");
    }
  };

  beforeAll(async () => {
    db = await createScratchDatabase();
    firstRun = (await runMigrations({ connectionString: db.url })).applied;
    await setLocalDevPasswords(db.url);
    // A tenant domain table as later migrations will create it: owned by ts_owner, RLS forced,
    // person reference through the composite membership key.
    await admin(`
      SET ROLE ts_owner;
      CREATE TABLE app.domain_probe (
        id int PRIMARY KEY,
        organization_id uuid NOT NULL REFERENCES app.organizations (id),
        owner_membership_id uuid NOT NULL,
        FOREIGN KEY (organization_id, owner_membership_id) REFERENCES app.memberships (organization_id, id)
      );
      ALTER TABLE app.domain_probe ENABLE ROW LEVEL SECURITY;
      ALTER TABLE app.domain_probe FORCE ROW LEVEL SECURITY;
      CREATE POLICY tenant_scope ON app.domain_probe FOR ALL
        USING (organization_id = app.current_organization_id())
        WITH CHECK (organization_id = app.current_organization_id());
      RESET ROLE;`);
    app = new Client({ connectionString: localRoleUrl(db.url, "ts_app") });
    auth = new Client({ connectionString: localRoleUrl(db.url, "ts_auth") });
    await app.connect();
    await auth.connect();

    // Fixtures written by ts_auth, as Better Auth would.
    await auth.query(
      `INSERT INTO auth.users (id, email, display_name, email_verified) VALUES
         ($1, 'owner.a@example.test', 'Synthetic A', true),
         ($2, 'recruiter.b@example.test', 'Synthetic B', true)`,
      [userA, userB],
    );
    await auth.query(
      `INSERT INTO app.organizations (id, name, slug) VALUES ($1, 'Bureau A', 'bureau-a'), ($2, 'Bureau B', 'bureau-b')`,
      [orgA, orgB],
    );
    await auth.query(
      `INSERT INTO app.memberships (id, organization_id, user_id, role) VALUES
         ($1, $2, $3, 'owner'), ($4, $5, $6, 'recruiter')`,
      [memberA, orgA, userA, memberB, orgB, userB],
    );
  });

  afterAll(async () => {
    await app?.end();
    await auth?.end();
    await db?.drop();
  });

  describe("migrations", () => {
    it("apply cleanly from scratch and are a no-op on the second run", async () => {
      expect(firstRun).toEqual(["0001_roles.sql", "0002_foundation.sql", "0003_identity.sql"]);
      expect((await runMigrations({ connectionString: db.url })).applied).toEqual([]);
    });

    it("place credential tables in auth and tenant identity tables in app, owned by ts_owner", async () => {
      const { rows } = await admin<{ schema: string; tables: string[]; owners: string[] }>(
        `SELECT n.nspname AS schema, array_agg(c.relname::text ORDER BY c.relname) AS tables,
                array_agg(DISTINCT pg_get_userbyid(c.relowner)::text) AS owners
           FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname IN ('app', 'auth') AND c.relkind = 'r' AND c.relname <> 'domain_probe'
          GROUP BY n.nspname ORDER BY n.nspname`,
      );
      expect(rows).toEqual([
        { schema: "app", tables: APP_IDENTITY_TABLES.toSorted(), owners: ["ts_owner"] },
        { schema: "auth", tables: AUTH_TABLES.toSorted(), owners: ["ts_owner"] },
      ]);
    });

    it("force RLS on every identity table", async () => {
      const { rows } = await admin(
        `SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname IN ('app', 'auth') AND c.relkind = 'r' AND c.relname <> 'domain_probe'
            AND NOT (c.relrowsecurity AND c.relforcerowsecurity)`,
      );
      expect(rows[0]).toEqual({ n: 0 });
    });
  });

  describe("ts_app", () => {
    it.each(AUTH_TABLES)("cannot select auth.%s", async (table) => {
      await expect(app.query(`SELECT * FROM auth.${table} LIMIT 1`)).rejects.toThrow(/permission denied/);
    });

    it("holds no privilege on any auth table, also not through a column grant", async () => {
      const { rows } = await admin(
        `SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'auth' AND c.relkind IN ('r', 'v', 'm', 'S')
            AND (has_table_privilege('ts_app', c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
              OR has_any_column_privilege('ts_app', c.oid, 'SELECT, INSERT, UPDATE, REFERENCES'))`,
      );
      expect(rows[0]).toEqual({ n: 0 });
    });

    it("cannot read invitations or write organizations and memberships", async () => {
      await asTenant(orgA, async () => {
        await app.query("SAVEPOINT s");
        await expect(app.query("SELECT * FROM app.organization_invitations")).rejects.toThrow(/permission denied/);
        await app.query("ROLLBACK TO SAVEPOINT s");
        await expect(
          app.query(`INSERT INTO app.memberships (organization_id, user_id, role) VALUES ($1, $2, 'owner')`, [
            orgA,
            userB,
          ]),
        ).rejects.toThrow(/permission denied/);
        await app.query("ROLLBACK TO SAVEPOINT s");
        await expect(app.query(`UPDATE app.organizations SET state = 'suspended'`)).rejects.toThrow(
          /permission denied/,
        );
      });
    });

    it("sees only the membership and organization of its tenant context", async () => {
      expect(await asTenant(orgA, readIdentityRows)).toEqual({ memberships: [memberA], organizations: [orgA] });
      expect(await asTenant(orgB, readIdentityRows)).toEqual({ memberships: [memberB], organizations: [orgB] });
      // Fails closed without context.
      expect(await asTenant(null, readIdentityRows)).toEqual({ memberships: [], organizations: [] });
    });

    it("cannot point a domain row at another organization's membership (composite FK)", async () => {
      await asTenant(orgA, async () => {
        await app.query("INSERT INTO app.domain_probe VALUES (1, $1, $2)", [orgA, memberA]);
        await expect(app.query("INSERT INTO app.domain_probe VALUES (2, $1, $2)", [orgA, memberB])).rejects.toThrow(
          /violates foreign key constraint/,
        );
      });
    });
  });

  describe("ts_auth", () => {
    it("reads and writes the auth tables", async () => {
      await auth.query("BEGIN");
      try {
        const session = await auth.query<{ id: string }>(
          `INSERT INTO auth.sessions (token, user_id, expires_at, active_organization_id)
           VALUES ('synthetic-token', $1, now() + interval '1 hour', $2) RETURNING id`,
          [userA, orgA],
        );
        await auth.query(
          `INSERT INTO auth.auth_accounts (user_id, provider_id, account_id, password)
           VALUES ($1, 'credential', $2, 'salt:hash')`,
          [userA, userA],
        );
        await auth.query(
          `INSERT INTO auth.auth_verifications (identifier, value, expires_at) VALUES ('h', 'v', now())`,
        );
        await auth.query(
          `INSERT INTO auth.auth_passkeys (user_id, public_key, credential_id, counter, device_type, backed_up)
           VALUES ($1, 'pk', 'cred', 0, 'singleDevice', false)`,
          [userA],
        );
        await auth.query(
          `INSERT INTO auth.auth_two_factors (user_id, secret, backup_codes) VALUES ($1, 'enc', 'enc')`,
          [userA],
        );
        await auth.query(`INSERT INTO auth.auth_rate_limits (key, count, last_request) VALUES ('k', 1, 0)`);
        await auth.query(
          `INSERT INTO auth.auth_security_events (user_id, organization_id, event_type) VALUES ($1, $2, 'session.created')`,
          [userA, orgA],
        );
        await auth.query(
          `INSERT INTO app.organization_invitations (organization_id, email, role, expires_at, inviter_id)
           VALUES ($1, 'invitee@example.test', 'viewer', now() + interval '7 days', $2)`,
          [orgA, userA],
        );
        await auth.query("UPDATE auth.sessions SET locked_at = now() WHERE id = $1", [session.rows[0]?.id]);
        await auth.query("UPDATE app.memberships SET state = 'suspended' WHERE id = $1", [memberB]);

        const { rows } = await auth.query(
          `SELECT (SELECT count(*) FROM auth.users)::int AS users,
                  (SELECT count(*) FROM auth.sessions WHERE locked_at IS NOT NULL)::int AS locked_sessions,
                  (SELECT count(*) FROM auth.auth_accounts)::int AS accounts,
                  (SELECT count(*) FROM auth.auth_verifications)::int AS verifications,
                  (SELECT count(*) FROM auth.auth_passkeys)::int AS passkeys,
                  (SELECT count(*) FROM auth.auth_two_factors)::int AS two_factors,
                  (SELECT count(*) FROM auth.auth_rate_limits)::int AS rate_limits,
                  (SELECT count(*) FROM auth.auth_security_events)::int AS events,
                  (SELECT count(*) FROM app.organization_invitations)::int AS invitations,
                  (SELECT count(*) FROM app.memberships)::int AS memberships_across_orgs`,
        );
        expect(rows[0]).toEqual({
          users: 2,
          locked_sessions: 1,
          accounts: 1,
          verifications: 1,
          passkeys: 1,
          two_factors: 1,
          rate_limits: 1,
          events: 1,
          invitations: 1,
          memberships_across_orgs: 2,
        });
        await auth.query("DELETE FROM auth.sessions WHERE user_id = $1", [userA]);
      } finally {
        await auth.query("ROLLBACK");
      }
    });

    it("cannot touch tenant domain tables", async () => {
      await expect(auth.query("SELECT * FROM app.domain_probe")).rejects.toThrow(/permission denied/);
      await expect(auth.query("INSERT INTO app.domain_probe VALUES (9, $1, $2)", [orgA, memberA])).rejects.toThrow(
        /permission denied/,
      );
      const { rows } = await admin<{ tables: string[] }>(
        `SELECT array_agg(c.relname::text ORDER BY c.relname) AS tables
           FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'app' AND c.relkind IN ('r', 'v', 'm', 'S')
            AND (has_table_privilege('ts_auth', c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
              OR has_any_column_privilege('ts_auth', c.oid, 'SELECT, INSERT, UPDATE, REFERENCES'))`,
      );
      expect(rows[0]?.tables).toEqual(APP_IDENTITY_TABLES.toSorted());
    });

    it("cannot delete organizations, memberships or invitations (suspend instead)", async () => {
      for (const table of APP_IDENTITY_TABLES) {
        // oxlint-disable-next-line no-await-in-loop
        await expect(authTry(`DELETE FROM app.${table}`)).rejects.toThrow(/permission denied/);
      }
    });

    it("can only append security events", async () => {
      await expect(authTry("UPDATE auth.auth_security_events SET event_type = 'x'")).rejects.toThrow(
        /permission denied/,
      );
      await expect(authTry("DELETE FROM auth.auth_security_events")).rejects.toThrow(/permission denied/);
    });
  });

  describe("constraints", () => {
    it("allow one membership per user and organization", async () => {
      await expect(
        authTry(`INSERT INTO app.memberships (organization_id, user_id, role) VALUES ($1, $2, 'viewer')`, [
          orgA,
          userA,
        ]),
      ).rejects.toThrow(/memberships_organization_user_unique/);
    });

    it("treat email addresses case-insensitively", async () => {
      await expect(
        authTry(`INSERT INTO auth.users (email, display_name) VALUES ('OWNER.A@example.test', 'Dup')`),
      ).rejects.toThrow(/users_email_unique/);
    });

    it("keep session tokens and provider accounts unique", async () => {
      await expect(
        authTry(`INSERT INTO auth.sessions (token, user_id, expires_at) VALUES ('t', $1, now()), ('t', $1, now())`, [
          userA,
        ]),
      ).rejects.toThrow(/sessions_token_unique/);
      await expect(
        authTry(
          `INSERT INTO auth.auth_accounts (user_id, provider_id, account_id)
           VALUES ($1, 'google', 'sub-1'), ($2, 'google', 'sub-1')`,
          [userA, userB],
        ),
      ).rejects.toThrow(/auth_accounts_provider_account_unique/);
    });

    it.each([
      [
        "membership role 'member'",
        `INSERT INTO app.memberships (organization_id, user_id, role) VALUES ('${orgA}', '${userB}', 'member')`,
        "memberships_role_check",
      ],
      [
        "multi-role membership",
        `INSERT INTO app.memberships (organization_id, user_id, role) VALUES ('${orgA}', '${userB}', 'admin,owner')`,
        "memberships_role_check",
      ],
      [
        "membership state 'invited'",
        `INSERT INTO app.memberships (organization_id, user_id, role, state) VALUES ('${orgA}', '${userB}', 'viewer', 'invited')`,
        "memberships_state_check",
      ],
      [
        "invitation status 'expired'",
        `INSERT INTO app.organization_invitations (organization_id, email, role, status, expires_at, inviter_id) VALUES ('${orgA}', 'x@example.test', 'viewer', 'expired', now(), '${userA}')`,
        "organization_invitations_status_check",
      ],
      [
        "invitation role 'member'",
        `INSERT INTO app.organization_invitations (organization_id, email, role, expires_at, inviter_id) VALUES ('${orgA}', 'x@example.test', 'member', now(), '${userA}')`,
        "organization_invitations_role_check",
      ],
      [
        "organization state 'archived'",
        `UPDATE app.organizations SET state = 'archived' WHERE id = '${orgA}'`,
        "organizations_state_check",
      ],
      [
        "organization locale 'de-DE'",
        `UPDATE app.organizations SET locale = 'de-DE' WHERE id = '${orgA}'`,
        "organizations_locale_check",
      ],
      [
        "platform role 'admin'",
        `UPDATE auth.users SET platform_role = 'admin' WHERE id = '${userA}'`,
        "users_platform_role_check",
      ],
      [
        "impersonated session",
        `INSERT INTO auth.sessions (token, user_id, expires_at, impersonated_by) VALUES ('i', '${userA}', now(), '${userB}')`,
        "sessions_no_impersonation_check",
      ],
    ])("reject %s", async (_name, sql, constraint) => {
      await expect(authTry(sql)).rejects.toThrow(new RegExp(constraint));
    });

    it("default organization locale, timezone and state", async () => {
      const { rows } = await admin("SELECT locale, timezone, state FROM app.organizations WHERE id = $1", [orgA]);
      expect(rows[0]).toEqual({ locale: "nl-NL", timezone: "Europe/Amsterdam", state: "active" });
    });
  });
});
