// Runtime schema check (ADR 0012): the Better Auth configuration with validateSchema: true
// against the database migrated with the shipped migrations. This, not `auth generate`, is the
// drift check: the CLI planner cannot see the schema-qualified `app.*` models. Runs in the CI
// `database` job (pnpm --filter @talentstroom/api test with DATABASE_TEST_URL).
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LogOnlyTransport } from "../mail/index.ts";
import { TEST_URL, createMigratedDatabase, localHyperdrive, type MigratedDatabase } from "../test-db.ts";
import { createAuth } from "./create-auth.ts";

/** Better Auth's internal schema check on the auth context (not in its public types). */
function schemaCheckOf(context: object, name: "checkSchema" | "explicitSchemaCheck") {
  const check: unknown = Reflect.get(context, name);
  return typeof check === "function" ? () => Promise.resolve(Reflect.apply(check, context, [])) : undefined;
}

describe.skipIf(TEST_URL === "")("Better Auth runtime schema check (Postgres)", () => {
  let db: MigratedDatabase;

  beforeAll(async () => {
    db = await createMigratedDatabase();
  }, 60_000);

  afterAll(async () => {
    await db?.drop();
  });

  async function schemaCheck(): Promise<void> {
    const handle = createAuth(
      {
        HYPERDRIVE_AUTH: localHyperdrive(db.authUrl),
        BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
        BETTER_AUTH_URL: "http://localhost:5173",
      },
      { mail: new LogOnlyTransport(() => undefined), waitUntil: () => undefined, validateSchema: true },
    );
    try {
      const context = await handle.auth.$context;
      // Guard against a vacuous pass: the adapter must have registered a runtime check.
      expect(schemaCheckOf(context, "checkSchema")).toBeTypeOf("function");
      const check = schemaCheckOf(context, "explicitSchemaCheck");
      expect(check).toBeTypeOf("function");
      await check?.();
    } finally {
      await handle.close();
    }
  }

  it("the migrated schema matches the Better Auth configuration (as ts_auth)", async () => {
    await expect(schemaCheck()).resolves.toBeUndefined();
  });

  it("detects drift in auth and app tables", async () => {
    await db.sql(`
      SET ROLE ts_owner;
      ALTER TABLE auth.sessions RENAME COLUMN active_organization_id TO active_org;
      ALTER TABLE app.memberships RENAME COLUMN state TO membership_state;
    `);
    const error = await schemaCheck().catch((e: unknown) => e);
    expect(String(error)).toMatch(/active_organization_id/);
    expect(String(error)).toMatch(/state/);
  });
});
