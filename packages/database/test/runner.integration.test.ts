// Runner behaviour against real Postgres (scratch databases, synthetic migrations).
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MigrationError, checksumOf, runMigrations } from "../src/index.ts";
import { TEST_URL, createScratchDatabase, withClient } from "./support.ts";
import type { ScratchDatabase } from "./support.ts";

describe.skipIf(TEST_URL === "")("migration runner (Postgres)", () => {
  let db: ScratchDatabase;
  let dir: string;

  const write = (name: string, sql: string) => writeFile(join(dir, name), sql);
  const migrate = () => runMigrations({ connectionString: db.url, migrationsDir: dir });
  const query = (sql: string) => withClient(db.url, (c) => c.query(sql));
  const tableExists = async (name: string) =>
    (await query(`SELECT to_regclass('public.${name}') IS NOT NULL AS ok`)).rows[0]?.ok === true;

  beforeEach(async () => {
    db = await createScratchDatabase();
    dir = await mkdtemp(join(tmpdir(), "ts-migrations-"));
    await write("0001_first.sql", "CREATE TABLE first_table (id int);");
    await write("0002_second.sql", "CREATE TABLE second_table (id int);");
  });

  afterEach(async () => {
    await db.drop();
    await rm(dir, { recursive: true, force: true });
  });

  it("applies pending files in order and records filename and checksum", async () => {
    expect((await migrate()).applied).toEqual(["0001_first.sql", "0002_second.sql"]);
    const rows = (await query("SELECT filename, checksum FROM migrations.schema_migrations ORDER BY version")).rows;
    expect(rows).toEqual([
      { filename: "0001_first.sql", checksum: checksumOf("CREATE TABLE first_table (id int);") },
      { filename: "0002_second.sql", checksum: checksumOf("CREATE TABLE second_table (id int);") },
    ]);
  });

  it("is a no-op on the second run", async () => {
    await migrate();
    expect((await migrate()).applied).toEqual([]);
    expect((await query("SELECT count(*)::int AS n FROM migrations.schema_migrations")).rows[0]).toEqual({ n: 2 });
  });

  it("refuses to run when an applied file's checksum changed", async () => {
    await migrate();
    await write("0001_first.sql", "CREATE TABLE first_table (id bigint);");
    await write("0003_third.sql", "CREATE TABLE third_table (id int);");
    await expect(migrate()).rejects.toThrow(/Checksum mismatch for applied migration 0001_first\.sql/);
    expect(await tableExists("third_table")).toBe(false);
  });

  it("rolls back a failing file completely and records nothing", async () => {
    await write("0003_broken.sql", "CREATE TABLE half_done (id int);\nSELECT 1 / 0;");
    await expect(migrate()).rejects.toThrow(MigrationError);
    expect(await tableExists("second_table")).toBe(true);
    expect(await tableExists("half_done")).toBe(false);
    const versions = (await query("SELECT version FROM migrations.schema_migrations ORDER BY 1")).rows;
    expect(versions).toEqual([{ version: "0001" }, { version: "0002" }]);
  });

  it("runs files marked no-transaction outside a transaction", async () => {
    await write(
      "0003_index.sql",
      "-- migrate:no-transaction\nCREATE INDEX CONCURRENTLY IF NOT EXISTS first_idx ON first_table (id);",
    );
    expect((await migrate()).applied).toContain("0003_index.sql");
    expect((await query("SELECT to_regclass('public.first_idx') IS NOT NULL AS ok")).rows[0]).toEqual({ ok: true });
  });

  it("serialises concurrent runs with the advisory lock", async () => {
    await write("0003_slow.sql", "SELECT pg_sleep(0.5);\nCREATE TABLE slow_table (id int);");
    const results = await Promise.all([migrate(), migrate(), migrate()]);
    expect(results.map((r) => r.applied.length).toSorted((x, y) => x - y)).toEqual([0, 0, 3]);
  });
});
