# @talentstroom/database

Schema migrations, database roles and (later, #56) the tenant-scoped data layer. Decisions: [ADR 0007](../../docs/adr/0007-database-neon-hyperdrive.md) (Neon, Hyperdrive, roles) and [ADR 0010](../../docs/adr/0010-migration-runner.md) (migration runner).

## Local setup

Requirements: Docker (Compose v2). Everything below runs on your machine only; the credentials in `compose.yaml`, `.env.example` and `src/local.ts` are **public throwaway values for the local container** and must never be used anywhere else.

```sh
pnpm db:reset                          # fresh Postgres + Mailpit, migrate, set local passwords
cp .env.example .env                   # DATABASE_MIGRATION_URL / DATABASE_TEST_URL for local tooling
cp apps/api/.env.example apps/api/.env # Hyperdrive local override, required by `wrangler dev`
```

| Command                 | What it does                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm db:up`            | Start Postgres (127.0.0.1:5432) and Mailpit (SMTP 127.0.0.1:1025, UI :8025), wait healthy |
| `pnpm db:down`          | Stop the containers, keep the data volume                                                 |
| `pnpm db:reset`         | Drop the volume, start again, apply all migrations, set local passwords (no seed yet)     |
| `pnpm db:migrate`       | Apply pending migrations to `DATABASE_MIGRATION_URL` (from the shell or `.env`)           |
| `pnpm db:dev-passwords` | Set the throwaway `ts_app`/`ts_auth` passwords; refuses non-local hosts                   |

`db:reset` always targets the compose database (`--local`), even if `.env` points elsewhere.

Integration tests run when `DATABASE_TEST_URL` (a superuser URL on the local server) is set, and are skipped with a message otherwise. They create and drop `ts_test_*` scratch databases:

```sh
DATABASE_TEST_URL=postgres://postgres:postgres_local_dev_only@127.0.0.1:5432/talentstroom \
  pnpm --filter @talentstroom/database test
```

Mail: point local SMTP at `127.0.0.1:1025` (any credentials accepted) and read messages at http://127.0.0.1:8025.

## Role model

| Role          | Login | Owns / may do                                                                             | Used by                                        |
| ------------- | ----- | ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `ts_owner`    | no    | owns schemas `app`, `auth` and every object in them                                       | nobody; the migrator `SET ROLE`s to it         |
| `ts_migrator` | yes   | `CREATEROLE`, `CREATE` on the database, `SET` membership in `ts_owner`                    | migrations on Neon (CI, direct endpoint)       |
| `ts_app`      | yes   | `USAGE` on `app`; `SELECT/INSERT/UPDATE/DELETE` on its tables, `EXECUTE` on its functions | API Worker via Hyperdrive binding `HYPERDRIVE` |
| `ts_auth`     | yes   | the same, on the `auth` schema only                                                       | Better Auth via `HYPERDRIVE_AUTH` (ADR 0006)   |

- `ts_app` and `ts_auth` are `NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOINHERIT`, members of no role, own no relation, cannot `SET ROLE ts_owner`, cannot create objects, cannot `TRUNCATE`, and cannot disable or un-force RLS (only the owner can). `ts_app` has no access to `auth`; `ts_auth` none to `app`. Tests: `test/roles.integration.test.ts`.
- Grants come from default privileges set by `0001_roles.sql` for objects that `ts_owner` creates, so every new migration must start with `SET LOCAL ROLE ts_owner;`. `EXECUTE` on new functions is revoked from `PUBLIC`.
- Role-level limits for both runtime roles: `statement_timeout 15s`, `lock_timeout 5s`, `idle_in_transaction_session_timeout 15s`.
- Locally the container superuser `postgres` is the migrator. Never point the API at it: a superuser bypasses RLS.
- Tenant context: `app.current_organization_id()` reads `app.organization_id` set with `set_config(..., true)` inside a transaction and returns NULL (fail closed) without it.

## Writing migrations

- New file `migrations/NNNN_lower_snake_case.sql`, next number, never edit or delete an applied file (the runner refuses on checksum mismatch). First statement: `SET LOCAL ROLE ts_owner;`.
- No `BEGIN`/`COMMIT`: the runner wraps each file in a transaction. For `CREATE INDEX CONCURRENTLY` and similar, put one idempotent statement in its own file whose first line is `-- migrate:no-transaction`. An index always belongs to its table's owner, so no role switch is needed there.
- No passwords, no data from production, no PII in migration files.

### Expand / migrate / contract

The API (`ts_app`) never runs DDL and old and new Worker versions overlap during deploys, so every schema change must be compatible with the code currently running:

1. **Expand** (release N): add new tables/columns/indexes as nullable or with defaults; add new functions next to old ones. Old code keeps working. Deploy migrations _before_ the Worker.
2. **Migrate** (release N): ship code that writes both shapes (or the new shape with a fallback) and backfill existing rows in batches (separate migration or job, short transactions).
3. **Contract** (release N+1 or later, once no running code reads the old shape): add constraints (`NOT NULL`, `VALIDATE CONSTRAINT`), drop old columns/functions.

Renames are expand (add new) + migrate (copy, dual-write) + contract (drop old), never `ALTER … RENAME` in one step. Long-running or locking operations (`CREATE INDEX` on large tables, `ADD CONSTRAINT … NOT VALID` then `VALIDATE`) get their own files.

## Running against Neon

Migrations always use the **direct (non-pooled) endpoint**, never Hyperdrive or Neon's pooler (the runner holds a session-level advisory lock).

One-time bootstrap per Neon project, as `neondb_owner` in the SQL editor (password set separately, see below):

```sql
CREATE ROLE ts_migrator LOGIN CREATEROLE NOINHERIT;  -- SQL-created: not in neon_superuser, no BYPASSRLS
GRANT CREATE ON DATABASE neondb TO ts_migrator;
```

Then `0001_roles.sql`, run as `ts_migrator`, creates `ts_owner`, `ts_app`, `ts_auth` (so `ts_migrator` holds `ADMIN` on them and can set their passwords) and grants itself `SET` on `ts_owner`. Do **not** create `ts_app`/`ts_auth` in the Neon Console: Console roles join `neon_superuser` (BYPASSRLS) and `0001_roles.sql` refuses them. If roles already exist without `ts_migrator` holding `ADMIN` (e.g. created by `neondb_owner`), `neondb_owner` must `GRANT ts_owner TO ts_migrator WITH INHERIT FALSE, SET TRUE` or drop them first.

```sh
# Credential from your password manager / CI secret; never commit it or put it in .env.example.
DATABASE_MIGRATION_URL='postgres://ts_migrator:…@<direct-host>/neondb?sslmode=verify-full' pnpm db:migrate
```

In CI the connection string is a GitHub Actions environment secret for the deploy job only (ADR 0007 section 6); it never reaches Workers.

### Production passwords

Passwords are never in this repository. Set them out of band, per Neon branch (child branches keep roles but password resets are branch-scoped):

```sql
-- as ts_migrator (ADMIN on the role) or neondb_owner; generate with e.g. `openssl rand -base64 32`
ALTER ROLE ts_app PASSWORD '…';
ALTER ROLE ts_auth PASSWORD '…';
```

Prefer psql's `\password ts_app` so the password does not end up in shell history or Neon's query history. Store each value only where it is consumed: the `ts_app` connection string in the `HYPERDRIVE` configuration (`wrangler hyperdrive create … --caching-disabled`), `ts_auth` in the `HYPERDRIVE_AUTH` configuration, `ts_migrator` in the GitHub environment secret and the team vault.
