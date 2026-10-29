# 0010 — Migration runner: own runner on `pg`

- **Status:** Accepted (approved by merging PR)
- **Date:** 2026-10-29
- **Resolves:** ADR 0007 open item 5 (runner part; `kysely-codegen` remains open)
- **Issue:** #53 (also #54)

## Context

ADR 0007 fixes the migration model: plain SQL as the schema source of truth, forward-only, numbered, one transaction per file, run over a **direct** Neon connection as `ts_migrator` (never Hyperdrive), with an explicit opt-out for statements that cannot run in a transaction (`CREATE INDEX CONCURRENTLY`). Objects must be owned by `ts_owner`, so files switch role with `SET LOCAL ROLE ts_owner`. Dependencies must be at least 7 days old and pinned in the pnpm catalog (ADR 0005). The repository is public, so tooling must read credentials only from the environment. Node 26 runs TypeScript directly (type stripping), so a runner needs no build step.

Requirements for #53: numbered `.sql` files; per-file transaction with an opt-out marker; a `schema_migrations` table with filename and SHA-256 checksum; refuse to run when an applied file changed; `pg_advisory_lock` against concurrent runs; connection string from `DATABASE_MIGRATION_URL`.

## Options considered

1. **Own runner on `pg` (about 200 lines in `packages/database`)** — does exactly the requirements and nothing else. `pg` is already the runtime driver (ADR 0007), so no new dependency. Checksums, ordering and the advisory lock are explicit, reviewable code with integration tests. Cons: we own the code (edge cases, maintenance); no down migrations or dry-run (not wanted anyway).
2. **`node-pg-migrate` 9.0.0** — npm package in the catalog, supports SQL files and per-file transactions, uses an advisory lock. Cons: its primary model is JavaScript migrations with `up`/`down`; SQL files are a secondary mode; it records names but **does not verify checksums**, so an edited applied file goes unnoticed; brings extra transitive dependencies (CLI parsing, config loading).
3. **`dbmate` 2.37.0** — single Go binary, plain SQL with `-- migrate:up` sections, per-file transactions with `transaction:false`, used widely. Cons: binary outside the pnpm catalog and the 7-day policy (needs its own checksum-pinned download in CI and on every developer machine); timestamp versions by default; **no checksum verification** of applied files; records only the version.

## Decision

**Option 1: own runner** in `@talentstroom/database` (`packages/database/src/migrator.ts`, CLI `src/cli.ts`, run with plain `node` under type stripping).

- Files: `packages/database/migrations/NNNN_lower_snake_case.sql`, applied in numeric order. Duplicate numbers, invalid names, and a pending file numbered below the last applied one are errors.
- Each file runs in `BEGIN … COMMIT` together with its bookkeeping row. Files must not contain their own `BEGIN`/`COMMIT` (rejected). A first line `-- migrate:no-transaction` runs the file outside a transaction; such a file holds a single idempotent statement (e.g. `CREATE INDEX CONCURRENTLY IF NOT EXISTS`), because its bookkeeping row is written afterwards and not atomically.
- `migrations.schema_migrations (version, filename, checksum, applied_at, applied_by, execution_ms)`, in its own schema owned by the migrator; runtime roles have no access. The checksum is SHA-256 over the file bytes. A changed or missing applied file stops the run before anything is applied.
- Session-level `pg_advisory_lock` on a fixed key for the whole run. This is valid only on a direct connection, which is the only way migrations run.
- After each file the runner resets session state (`RESET ALL; RESET ROLE`) so files cannot leak settings into each other.
- Connection string from `DATABASE_MIGRATION_URL`; never logged. `--local` uses the compose database instead.

Why: it is the only option that verifies checksums (the explicit #53 requirement) without wrapping a third-party tool, adds no dependency beyond `pg`, stays inside the TypeScript toolchain, and keeps the security-relevant behaviour (role switching, ordering, locking) small enough to review in one sitting.

## Consequences

- **Easier:** one language and one driver for runtime and migrations; behaviour is covered by integration tests (`packages/database/test/runner.integration.test.ts`) in the `database` CI job; no binary to pin.
- **Harder:** we maintain the runner. No down migrations: rollbacks are new forward migrations (expand/migrate/contract, `packages/database/README.md`). No dry-run or status command yet.
- **Security:** migration credentials only from the environment, direct connection only; the runner refuses edited history, which protects against silently diverging databases. The bookkeeping schema is not readable by `ts_app`/`ts_auth`.
- **Cost:** none beyond maintenance.

## Rollback

Switch to `dbmate` or `node-pg-migrate` by importing the rows of `migrations.schema_migrations` into the tool's own table (both key on a version string) and renaming files to the tool's convention. Expected cost: a day, plus losing checksum verification unless re-implemented around the tool.
