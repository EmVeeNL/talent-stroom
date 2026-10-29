import { randomBytes } from "node:crypto";
import process from "node:process";
import { Client } from "pg";

/** Superuser URL of the local/CI Postgres. Integration tests are skipped without it. */
export const TEST_URL = process.env["DATABASE_TEST_URL"] ?? "";

export interface ScratchDatabase {
  url: string;
  drop: () => Promise<void>;
}

async function withClient<T>(url: string, fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Creates an empty, uniquely named database on the test server. */
export async function createScratchDatabase(): Promise<ScratchDatabase> {
  const name = `ts_test_${randomBytes(6).toString("hex")}`;
  await withClient(TEST_URL, (c) => c.query(`CREATE DATABASE ${name}`));
  const url = new URL(TEST_URL);
  url.pathname = `/${name}`;
  return {
    url: url.toString(),
    drop: () =>
      withClient(TEST_URL, (c) => c.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`)).then(() => undefined),
  };
}

export { withClient };
