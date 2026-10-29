// Unit tests: no database needed.
import { describe, expect, it } from "vitest";
import { MigrationError, checksumOf, loadMigrations, parseMigration, planMigrations } from "../src/index.ts";
import { assertLocalDatabase, localRoleUrl } from "../src/local.ts";

const file = (name: string, sql: string) => parseMigration(name, Buffer.from(sql));

describe("parseMigration", () => {
  it("accepts NNNN_snake_case.sql and records a SHA-256 checksum", () => {
    const m = file("0007_add_things.sql", "SELECT 1;");
    expect(m.version).toBe("0007");
    expect(m.checksum).toBe(checksumOf("SELECT 1;"));
    expect(m.checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(m.transactional).toBe(true);
  });

  it.each(["1_x.sql", "0001-x.sql", "0001_X.sql", "0001_.sql", "0001_x.SQL"])("rejects filename %s", (name) => {
    expect(() => file(name, "SELECT 1;")).toThrow(MigrationError);
  });

  it("honours the no-transaction marker on the first non-blank line", () => {
    const m = file("0003_idx.sql", "\n-- migrate:no-transaction\nCREATE INDEX CONCURRENTLY x ON t (a);");
    expect(m.transactional).toBe(false);
  });

  it("rejects explicit transaction control in transactional files", () => {
    expect(() => file("0001_x.sql", "BEGIN;\nSELECT 1;\nCOMMIT;")).toThrow(/transaction control/);
  });

  it("allows PL/pgSQL blocks", () => {
    expect(() => file("0001_x.sql", "DO $$\nBEGIN\n  IF true THEN\n    NULL;\n  END IF;\nEND\n$$;")).not.toThrow();
  });
});

describe("planMigrations", () => {
  const a = file("0001_a.sql", "SELECT 1;");
  const b = file("0002_b.sql", "SELECT 2;");
  const row = (m: typeof a, checksum = m.checksum) => ({
    version: m.version,
    filename: m.filename,
    checksum,
  });

  it("returns only pending files", () => {
    expect(planMigrations([a, b], [row(a)])).toEqual([b]);
    expect(planMigrations([a, b], [row(a), row(b)])).toEqual([]);
  });

  it("refuses when an applied file changed", () => {
    expect(() => planMigrations([a, b], [row(a, "0".repeat(64))])).toThrow(/Checksum mismatch/);
  });

  it("refuses when an applied file is missing", () => {
    expect(() => planMigrations([b], [row(a), row(b)])).toThrow(/missing/);
  });

  it("refuses a new file that sorts before the last applied one", () => {
    expect(() => planMigrations([a, b], [row(b)])).toThrow(/sorts before/);
  });
});

describe("shipped migrations", () => {
  it("are valid, numbered from 0001 and contiguous", async () => {
    const migrations = await loadMigrations();
    expect(migrations.map((m) => m.version)).toEqual(migrations.map((_, i) => String(i + 1).padStart(4, "0")));
    expect(migrations.length).toBeGreaterThanOrEqual(2);
  });
});

describe("local credential guard", () => {
  it("only accepts local hosts", () => {
    expect(() => assertLocalDatabase("postgres://u:p@127.0.0.1:5432/db")).not.toThrow();
    expect(() => assertLocalDatabase("postgres://u:p@localhost/db")).not.toThrow();
    expect(() => assertLocalDatabase("postgres://u:p@ep-x.eu-central-1.aws.neon.tech/db")).toThrow(/non-local/);
  });

  it("builds role URLs on the same local server", () => {
    const url = new URL(localRoleUrl("postgres://postgres:x@127.0.0.1:5432/scratch", "ts_app"));
    expect(url.username).toBe("ts_app");
    expect(url.pathname).toBe("/scratch");
  });
});
