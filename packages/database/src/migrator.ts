// Forward-only SQL migration runner (ADR 0010).
//
// - Files: `NNNN_snake_case.sql` in one directory, applied in numeric order.
// - Each file runs in its own transaction together with its bookkeeping row, unless its
//   first line is `-- migrate:no-transaction` (for statements such as CREATE INDEX CONCURRENTLY).
// - `migrations.schema_migrations` records the filename and SHA-256 checksum of every applied file.
//   The runner refuses to start if an applied file changed, disappeared, or a new file sorts
//   before the last applied one.
// - A session-level advisory lock serialises concurrent runs. This needs a direct connection
//   (never Hyperdrive or a transaction pooler), which is how migrations run anyway (ADR 0007).
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

/** Default migrations directory shipped with this package. */
export const MIGRATIONS_DIR = fileURLToPath(new URL("../migrations/", import.meta.url));

/** Marker (first non-blank line) that opts a file out of the per-file transaction. */
export const NO_TRANSACTION_MARKER = "-- migrate:no-transaction";

/** Arbitrary, fixed key for pg_advisory_lock; only migration runs use it. */
const ADVISORY_LOCK_KEY = "7253051053";

const FILENAME_PATTERN = /^(\d{4})_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/;
// Explicit transaction control would break the per-file transaction. (PL/pgSQL `BEGIN`
// has no semicolon, so DO blocks are not matched.)
const TRANSACTION_CONTROL = /^\s*(?:BEGIN|COMMIT|ROLLBACK|START\s+TRANSACTION|END\s+TRANSACTION)\s*;/im;

export interface Migration {
  version: string;
  filename: string;
  sql: string;
  checksum: string;
  transactional: boolean;
}

export interface MigrateOptions {
  connectionString: string;
  migrationsDir?: string;
  log?: (message: string) => void;
}

export interface MigrateResult {
  applied: string[];
}

export class MigrationError extends Error {
  override name = "MigrationError";
}

export function checksumOf(contents: Buffer | string): string {
  return createHash("sha256").update(contents).digest("hex");
}

export function parseMigration(filename: string, contents: Buffer): Migration {
  const match = FILENAME_PATTERN.exec(filename);
  const version = match?.[1];
  if (version === undefined) {
    throw new MigrationError(`Invalid migration filename "${filename}": expected NNNN_lower_snake_case.sql`);
  }
  const sql = contents.toString("utf8");
  const firstLine = sql.split(/\r?\n/).find((line) => line.trim() !== "") ?? "";
  const transactional = firstLine.trim() !== NO_TRANSACTION_MARKER;
  if (transactional && TRANSACTION_CONTROL.test(sql)) {
    throw new MigrationError(
      `${filename} contains transaction control (BEGIN/COMMIT/ROLLBACK); the runner wraps each file in a transaction`,
    );
  }
  return { version, filename, sql, checksum: checksumOf(contents), transactional };
}

export async function loadMigrations(dir: string = MIGRATIONS_DIR): Promise<Migration[]> {
  const filenames = (await readdir(dir)).filter((name) => name.endsWith(".sql")).toSorted();
  const contents = await Promise.all(filenames.map((name) => readFile(join(dir, name))));
  const migrations = filenames.map((name, i) => parseMigration(name, contents[i] ?? Buffer.alloc(0)));
  const seen = new Set<string>();
  for (const migration of migrations) {
    if (seen.has(migration.version)) {
      throw new MigrationError(`Duplicate migration number ${migration.version} (${migration.filename})`);
    }
    seen.add(migration.version);
  }
  return migrations;
}

interface AppliedRow {
  version: string;
  filename: string;
  checksum: string;
}

/** Returns the migrations still to apply, or throws if history and files disagree. */
export function planMigrations(migrations: Migration[], applied: AppliedRow[]): Migration[] {
  const byVersion = new Map(migrations.map((m) => [m.version, m]));
  let lastApplied = "";
  for (const row of applied) {
    const file = byVersion.get(row.version);
    if (file === undefined || file.filename !== row.filename) {
      throw new MigrationError(`Applied migration ${row.filename} is missing from the migrations directory`);
    }
    if (file.checksum !== row.checksum) {
      throw new MigrationError(
        `Checksum mismatch for applied migration ${row.filename}: migrations are forward-only, add a new file instead of editing an applied one`,
      );
    }
    if (row.version > lastApplied) lastApplied = row.version;
  }
  const appliedVersions = new Set(applied.map((row) => row.version));
  const pending = migrations.filter((m) => !appliedVersions.has(m.version));
  const outOfOrder = pending.find((m) => m.version < lastApplied);
  if (outOfOrder !== undefined) {
    throw new MigrationError(
      `${outOfOrder.filename} sorts before the last applied migration ${lastApplied}; renumber it`,
    );
  }
  return pending;
}

const BOOKKEEPING_SQL = `
  CREATE SCHEMA IF NOT EXISTS migrations;
  CREATE TABLE IF NOT EXISTS migrations.schema_migrations (
    version      text PRIMARY KEY,
    filename     text NOT NULL UNIQUE,
    checksum     text NOT NULL,
    applied_at   timestamptz NOT NULL DEFAULT now(),
    applied_by   text NOT NULL DEFAULT session_user,
    execution_ms integer NOT NULL
  );`;

const RECORD_SQL =
  "INSERT INTO migrations.schema_migrations (version, filename, checksum, execution_ms) VALUES ($1, $2, $3, $4)";

export async function runMigrations(options: MigrateOptions): Promise<MigrateResult> {
  const log = options.log ?? (() => undefined);
  // Validate files before touching the database.
  const migrations = await loadMigrations(options.migrationsDir);
  const client = new Client({
    connectionString: options.connectionString,
    application_name: "talentstroom-migrate",
  });
  await client.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1::bigint)", [ADVISORY_LOCK_KEY]);
    try {
      const exists = await client.query<{ table: string | null }>(
        "SELECT to_regclass('migrations.schema_migrations')::text AS table",
      );
      if ((exists.rows[0]?.table ?? null) === null) await client.query(BOOKKEEPING_SQL);

      const appliedRows = await client.query<AppliedRow>(
        "SELECT version, filename, checksum FROM migrations.schema_migrations ORDER BY version",
      );
      const pending = planMigrations(migrations, appliedRows.rows);
      if (pending.length === 0) log("Database is up to date.");

      const applied: string[] = [];
      for (const migration of pending) {
        // Strictly sequential: each file may depend on the previous one.
        // oxlint-disable-next-line no-await-in-loop
        await apply(client, migration);
        applied.push(migration.filename);
        log(`Applied ${migration.filename}`);
      }
      return { applied };
    } finally {
      await client.query("SELECT pg_advisory_unlock($1::bigint)", [ADVISORY_LOCK_KEY]);
    }
  } finally {
    await client.end();
  }
}

async function apply(client: Client, migration: Migration): Promise<void> {
  const started = performance.now();
  const record = (): unknown[] => [
    migration.version,
    migration.filename,
    migration.checksum,
    Math.round(performance.now() - started),
  ];

  if (!migration.transactional) {
    // Not atomic with its bookkeeping row: such files must be idempotent (IF NOT EXISTS)
    // and contain a single statement (several statements in one simple query share an
    // implicit transaction).
    try {
      await client.query(migration.sql);
    } catch (error) {
      throw new MigrationError(`${migration.filename} failed`, { cause: error });
    } finally {
      await client.query("RESET ALL; RESET ROLE");
    }
    await client.query(RECORD_SQL, record());
    return;
  }

  await client.query("BEGIN");
  try {
    await client.query(migration.sql);
    // Files may SET LOCAL ROLE ts_owner; the bookkeeping row is written as the migrator.
    await client.query("RESET ROLE");
    await client.query(RECORD_SQL, record());
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw new MigrationError(`${migration.filename} failed and was rolled back`, {
      cause: error,
    });
  } finally {
    // Drop any session-level SET a file may have made, so files cannot affect each other.
    await client.query("RESET ALL; RESET ROLE").catch(() => undefined);
  }
}
