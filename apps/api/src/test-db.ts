// Real-Postgres support for the API integration tests. LOCAL/CI DATABASES ONLY: uses the
// throwaway role passwords from @talentstroom/database/local. Tests skip without
// DATABASE_TEST_URL (a superuser URL on the local server, see the root .env.example).
import { randomBytes } from "node:crypto";
import process from "node:process";
import { runMigrations } from "@talentstroom/database";
import { localRoleUrl, setLocalDevPasswords } from "@talentstroom/database/local";
import type { ExecutionContext } from "hono";
import { Client } from "pg";

export const TEST_URL = process.env["DATABASE_TEST_URL"] ?? "";

if (TEST_URL === "") {
  console.warn(
    "\n[api] DATABASE_TEST_URL is not set: Postgres integration tests are SKIPPED.\n" +
      "      Run `pnpm db:up` and set DATABASE_TEST_URL (see .env.example) to run them.\n",
  );
}

export async function withClient<T>(url: string, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export interface MigratedDatabase {
  /** Superuser connection (test setup and assertions only). */
  adminUrl: string;
  authUrl: string;
  appUrl: string;
  sql: <T extends Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;
  drop: () => Promise<void>;
}

/** Creates a uniquely named scratch database with all migrations applied. */
export async function createMigratedDatabase(): Promise<MigratedDatabase> {
  const name = `ts_test_api_${randomBytes(6).toString("hex")}`;
  await withClient(TEST_URL, (c) => c.query(`CREATE DATABASE ${name}`));
  const url = new URL(TEST_URL);
  url.pathname = `/${name}`;
  const adminUrl = url.toString();
  await runMigrations({ connectionString: adminUrl });
  await setLocalDevPasswords(adminUrl);
  return {
    adminUrl,
    authUrl: localRoleUrl(adminUrl, "ts_auth"),
    appUrl: localRoleUrl(adminUrl, "ts_app"),
    sql: async <T extends Record<string, unknown>>(text: string, params: unknown[] = []) =>
      withClient(adminUrl, async (c) => (await c.query<T>(text, params)).rows),
    drop: async () => {
      await withClient(TEST_URL, (c) => c.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`));
    },
  };
}

/** A Hyperdrive binding stand-in that only offers a connection string. */
export function localHyperdrive(connectionString: string): Hyperdrive {
  const url = new URL(connectionString);
  const binding: Hyperdrive = {
    connectionString,
    host: url.hostname,
    ip: url.hostname,
    port: Number(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    connect: () => {
      throw new Error("Hyperdrive.connect is not used");
    },
  };
  return binding;
}

/** ExecutionContext that remembers waitUntil promises so a test can await them. */
export function testExecutionContext() {
  const pending: Promise<unknown>[] = [];
  const ctx: ExecutionContext = {
    waitUntil: (promise) => {
      pending.push(promise);
    },
    passThroughOnException: () => undefined,
    props: {},
  };
  // waitUntil work may schedule more work (e.g. pool close after mail): drain until empty.
  const settle = async (): Promise<void> => {
    if (pending.length === 0) return;
    await Promise.allSettled(pending.splice(0));
    return settle();
  };
  return { ctx, settle };
}
