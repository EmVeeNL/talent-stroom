import { verifyPassword } from "better-auth/crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MIGRATIONS_DIR, runMigrations } from "../src/index.ts";
import { DEVELOPMENT_PASSWORD, seedDatabase } from "../src/seed.ts";
import { TEST_URL, createScratchDatabase, withClient } from "./support.ts";
import type { ScratchDatabase } from "./support.ts";

describe.skipIf(TEST_URL === "")("database seed (Postgres)", () => {
  let db: ScratchDatabase;

  beforeEach(async () => {
    db = await createScratchDatabase();
    await runMigrations({ connectionString: db.url, migrationsDir: MIGRATIONS_DIR });
  });

  afterEach(async () => db.drop());

  it("can run twice without duplicates and stores Better Auth password hashes", async () => {
    await seedDatabase(db.url);
    await seedDatabase(db.url);

    const counts = await withClient(db.url, async (client) => {
      const result = await client.query<{
        organizations: string;
        users: string;
        accounts: string;
        memberships: string;
      }>(
        `SELECT
          (SELECT count(*) FROM app.organizations)::text AS organizations,
          (SELECT count(*) FROM auth.users)::text AS users,
          (SELECT count(*) FROM auth.auth_accounts)::text AS accounts,
          (SELECT count(*) FROM app.memberships)::text AS memberships`,
      );
      return result.rows[0];
    });
    expect(counts).toEqual({ organizations: "2", users: "4", accounts: "4", memberships: "5" });

    const hashes = await withClient(db.url, async (client) => {
      const result = await client.query<{ password: string | null }>(
        `SELECT a.password FROM auth.auth_accounts a
         JOIN auth.users u ON u.id = a.user_id ORDER BY u.email`,
      );
      return result.rows.map((row) => row.password);
    });
    expect(hashes).toHaveLength(4);
    for (const hash of hashes) {
      if (hash === null) throw new Error("Seeded credential has no password hash");
      // eslint-disable-next-line no-await-in-loop -- Verify each real Better Auth hash independently.
      expect(await verifyPassword({ hash, password: DEVELOPMENT_PASSWORD })).toBe(true);
    }
  });
});
