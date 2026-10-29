# @talentstroom/database

Schema migrations, database roles and the tenant-scoped Kysely data layer. Decisions: [ADR 0007](../../docs/adr/0007-database-neon-hyperdrive.md) (Neon, Hyperdrive, roles) and [ADR 0010](../../docs/adr/0010-migration-runner.md) (migration runner).

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
| `ts_auth`     | yes   | the same on `auth`; on `app` only the three identity tables listed below                  | Better Auth via `HYPERDRIVE_AUTH` (ADR 0006)   |

- `ts_app` and `ts_auth` are `NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOINHERIT`, members of no role, own no relation, cannot `SET ROLE ts_owner`, cannot create objects, cannot `TRUNCATE`, and cannot disable or un-force RLS (only the owner can). `ts_app` has no access to `auth`; `ts_auth` none to `app` domain tables. Tests: `test/roles.integration.test.ts`, `test/identity.integration.test.ts`.
- Grants come from default privileges set by `0001_roles.sql` for objects that `ts_owner` creates, so every new migration must start with `SET LOCAL ROLE ts_owner;`. `EXECUTE` on new functions is revoked from `PUBLIC`.
- Role-level limits for both runtime roles: `statement_timeout 15s`, `lock_timeout 5s`, `idle_in_transaction_session_timeout 15s`.
- Locally the container superuser `postgres` is the migrator. Never point the API at it: a superuser bypasses RLS.
- Tenant context: `app.current_organization_id()` reads `app.organization_id` set with `set_config(..., true)` inside a transaction and returns NULL (fail closed) without it.

## Tenant queries on Workers

Workers import the tenant layer from `@talentstroom/database/tenant` (same exports as below,
without the migrator, which needs `node:fs` and runs top-level code). Create a handle **inside each request handler**, using the uncached `HYPERDRIVE.connectionString`
(`ts_app`). The handle owns one `pg` Client and a private Kysely `PostgresDialect`, with a
single-connection pool wrapper (`max: 1`). It connects lazily and serializes transactions
on that handle. Never keep a handle or client in module scope or share one between requests.

`TenantContext.fromVerifiedMembership(...)` must be called **only after server-side membership
verification**. It validates UUID shape and produces an immutable opaque context; it does
not verify membership itself. A request header alone is never sufficient. The optional
`membershipId` is the verified membership's ID for audit context.

```ts
import { createDatabase, TenantContext, withTenant } from "@talentstroom/database";

// Illustrative table/type; replace with the generated schema when domain tables land.
interface DatabaseSchema {
  "app.example": { id: string; organization_id: string };
}

// Called from the handler after the identity/membership checks have succeeded.
// Env is the consuming Worker's generated type.
async function readRecords(
  env: Env,
  ctx: ExecutionContext,
  verifiedMembership: { organizationId: string; membershipId: string },
) {
  const tenant = TenantContext.fromVerifiedMembership(verifiedMembership);
  const db = createDatabase<DatabaseSchema>(env.HYPERDRIVE.connectionString);
  try {
    return await withTenant(db, tenant, (trx) => trx.selectFrom("app.example").selectAll().execute());
  } finally {
    ctx.waitUntil(db.close()); // Or await db.close() in finally for synchronous cleanup.
  }
}
```

Every tenant query goes through `withTenant(db, tenant, fn)`. It begins a Kysely transaction,
sets `app.organization_id` with a bound `set_config(..., true)` as the first statement after
`BEGIN`, and sets `app.membership_id` when provided. The settings are transaction-local:
success commits, failure rolls back, and neither identifier survives the boundary. There
is no default tenant or public unrestricted Kysely/client accessor. Context errors do not
include submitted values. Await all callback queries and return data, not a transaction or
query builder; queries through a retained callback transaction are rejected after it ends.

Keep transactions short: **never call KMS inside `withTenant`**, and keep HTTP/AI and other
external calls outside it. Fetch encrypted records in the transaction, then unwrap/decrypt
after commit. Do not nest `withTenant` on the same handle or call `close()` from its callback;
these wait for the single occupied connection. Close after all request transactions finish;
closing is idempotent and waits for an active transaction before ending the client.

Identity/bootstrap is a separate narrow path, outside this helper's scope. In particular,
Better Auth and membership verification use `HYPERDRIVE_AUTH` as `ts_auth`, which cannot
access tenant tables; never point this tenant handle at that binding (ADR 0006).

The real-Postgres tests in `test/tenant.integration.test.ts` exercise two handles and queued
transactions for both organizations over 50 repetitions, same-connection cleanup after
commit/rollback, audit context, RLS write rejection and callback write rollback. The runtime
role restrictions (including no RLS bypass or `SET ROLE`) remain covered by
`test/roles.integration.test.ts`. Local tests do not prove deployed Hyperdrive behavior;
the Neon/Hyperdrive acceptance run from ADR 0007 remains a deployment/CI follow-up.

## Tables and access

Identity and tenancy (`0003_identity.sql`, [ADR 0012](../../docs/adr/0012-identity-schema-placement.md)). Credentials and global identity live in `auth`; the tenant root and tenant-scoped identity rows that domain tables reference live in `app`. RLS is enabled and forced on every table below; a role without a policy sees no rows.

| Schema | Table                      | Purpose                                                           | `ts_auth`                    | `ts_app`                        |
| ------ | -------------------------- | ----------------------------------------------------------------- | ---------------------------- | ------------------------------- |
| `auth` | `users`                    | people (Better Auth `user`); unique `lower(email)`                | DML                          | none                            |
| `auth` | `sessions`                 | unique `token`, `active_organization_id`, idle-lock columns       | DML                          | none                            |
| `auth` | `auth_accounts`            | password hash, OAuth accounts; unique `(provider_id, account_id)` | DML                          | none                            |
| `auth` | `auth_verifications`       | email verification, reset, OAuth state (hashed identifier)        | DML                          | none                            |
| `auth` | `auth_passkeys`            | WebAuthn credentials                                              | DML                          | none                            |
| `auth` | `auth_two_factors`         | encrypted TOTP secret and backup codes                            | DML                          | none                            |
| `auth` | `auth_rate_limits`         | Better Auth rate limiter                                          | DML                          | none                            |
| `auth` | `auth_security_events`     | ours, append-only                                                 | `SELECT`, `INSERT`           | none                            |
| `app`  | `organizations`            | tenant root (Better Auth `organization` + our columns)            | `SELECT`, `INSERT`, `UPDATE` | `SELECT` own organization (RLS) |
| `app`  | `memberships`              | Better Auth `member`; suspended, never deleted                    | `SELECT`, `INSERT`, `UPDATE` | `SELECT` own organization (RLS) |
| `app`  | `organization_invitations` | Better Auth `invitation`                                          | `SELECT`, `INSERT`, `UPDATE` | none                            |
| `app`  | domain tables (later)      | tenant data                                                       | none                         | DML under tenant RLS            |

- Domain tables reference the tenant as `organization_id REFERENCES app.organizations (id)` and people as `FOREIGN KEY (organization_id, <x>_membership_id) REFERENCES app.memberships (organization_id, id)`, never `auth.*`.
- New `app` tables get `ts_app` DML from default privileges and nothing for `ts_auth`; new `auth` tables get `ts_auth` DML and nothing for `ts_app`. Narrow these in the migration when a table needs less (as `0003` does).

## Encrypted candidates (0004)

Migration `0004_candidates.sql` implements [ADR 0011](../../docs/adr/0011-envelope-encryption-format.md).

| Table                         | Stored data                                                                  | Access              |
| ----------------------------- | ---------------------------------------------------------------------------- | ------------------- |
| `app.candidates`              | Metadata, owner membership, timestamps, status, optimistic `version`; no PII | `ts_app` tenant DML |
| `app.candidate_private`       | Whole serialized envelope in `bytea`, payload schema version                 | `ts_app` tenant DML |
| `app.candidate_blind_indexes` | Versioned 32-byte HMAC digests for email/phone exact matching                | `ts_app` tenant DML |

All three tables enable and force RLS. Without tenant context `ts_app` sees no rows;
`ts_auth` has neither grants nor policies. Composite foreign keys prevent cross-tenant
candidate and owner references. There is no separate `encryption_key_envelopes` table:
the wrapped DEK, KEK version, nonce and authenticated ciphertext travel together in the envelope.
The database checks the envelope format byte; the crypto parser checks the full binary format,
including nonce and ciphertext lengths, before decryption authenticates it.

The public repository functions `createCandidate`, `getCandidatePrivate`,
`updateCandidatePrivate` and `findCandidateIdsByBlindIndex` accept encrypted bytes/digests
and own their `withTenant` transaction. Create and update atomically store the envelope and
complete index set. Updates increment `candidates.version` only when `expectedVersion`
matches; `{ kind: "conflict" }` covers stale, missing and inaccessible rows. No callbacks
or open transactions escape these functions. `source` must be a controlled code, never
free text containing personal data.

`createCandidateService(db, deps)` is a small request-scoped helper in this package, keeping
the two-phase workflow next to the repository instead of adding another package for one
record type. Pass a real KMS adapter, environment, the authorized organization's `kekRef`,
an already-unwrapped environment index root (`indexRoot`), and `indexVersion`. Membership
and permissions must already have been verified before passing a `TenantContext`.

- `create(tenant, { candidateId, schemaVersion, payload, ownerMembershipId?, source? })`
  normalizes email/phone for HKDF-scoped blind indexes and encrypts the JSON payload
  **before** opening the database transaction. The payload retains its original formatting.
- `get(tenant, candidateId)` commits the read **before** parsing/decrypting, using the verified
  organization, requested candidate id, `recordType: "candidate_private"` and stored schema
  version as authenticated context. Returns `{ version, schemaVersion, payload }` (payload
  is `unknown`; validate against the application's schema), or `undefined` if inaccessible.
- `update(tenant, { candidateId, schemaVersion, payload, expectedVersion })` encrypts first,
  then replaces the full envelope/index set with optimistic concurrency.
- `find(tenant, "email" | "phone", value)` normalizes and derives the tenant/field/version key
  before querying. It returns candidate IDs only; callers fetching matches must authorize,
  decrypt and verify them before returning minimal fields (flow 20).

The helper maintains one index version. Rotation jobs can use the repository's complete
index set to maintain multiple versions during dual-write/reindex; orchestration is follow-up
work. The caller owns root lifetime/zeroization; roots, plaintext and KMS calls never enter
repository transactions. Never log database errors with bound parameters, which can include
ciphertext and index digests. No plaintext is logged or cached by the helper.

`test/candidates.integration.test.ts` exercises dump bytes, swapped ciphertext, normalized
tenant-only lookup, conflicts, atomic rollback, role denial, constraints and migration reruns.
KMS probes also check Postgres for an open runtime transaction at wrap/unwrap boundaries.

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
