// LOCAL DOCKER DATABASE ONLY. Throwaway credentials for compose.yaml / the CI service
// container. They are public on purpose and must never be used for Neon or any shared
// database; production passwords are set out of band (packages/database/README.md).
import { Client } from "pg";

/** Superuser connection to the compose.yaml Postgres (acts as the local migrator). */
export const LOCAL_MIGRATION_URL = "postgres://postgres:postgres_local_dev_only@127.0.0.1:5432/talentstroom";

/** Throwaway passwords for the runtime login roles in the local container. */
export const LOCAL_DEV_PASSWORDS = {
  ts_app: "ts_app_local_dev_only",
  ts_auth: "ts_auth_local_dev_only",
} as const;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/** Throws unless the connection string points at this machine. */
export function assertLocalDatabase(connectionString: string): void {
  const host = new URL(connectionString).hostname;
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Refusing to use local development credentials against non-local host "${host}"`);
  }
}

/** Sets the throwaway passwords for ts_app and ts_auth. Local databases only. */
export async function setLocalDevPasswords(connectionString: string): Promise<void> {
  assertLocalDatabase(connectionString);
  const client = new Client({ connectionString });
  await client.connect();
  try {
    // ALTER ROLE cannot take bind parameters; quote with the driver's escaping.
    const statements = Object.entries(LOCAL_DEV_PASSWORDS).map(
      ([role, password]) => `ALTER ROLE ${client.escapeIdentifier(role)} PASSWORD ${client.escapeLiteral(password)};`,
    );
    await client.query(statements.join("\n"));
  } finally {
    await client.end();
  }
}

/** Connection string for `role` on the same local server and database as `connectionString`. */
export function localRoleUrl(connectionString: string, role: keyof typeof LOCAL_DEV_PASSWORDS): string {
  assertLocalDatabase(connectionString);
  const url = new URL(connectionString);
  url.username = role;
  url.password = LOCAL_DEV_PASSWORDS[role];
  return url.toString();
}
