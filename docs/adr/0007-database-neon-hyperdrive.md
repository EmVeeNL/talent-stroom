# 0007 — Database: Neon Postgres via Cloudflare Hyperdrive

- **Status:** Accepted
- **Date:** 2026-10-29
- **Resolves:** D02 (partially: provider and region; legal sub-processor review remains open), D14 (database part: Worker driver and connectivity; KMS part remains open)
- **Issue:** #20 (also informs #42, #53, #54, #56)

## Context

TalentStroom stores candidate personal data for Dutch boutique agencies and must stay in the EU. Tenant isolation relies on application checks plus Postgres row-level security (RLS) keyed on `app.organization_id`, set with `SET LOCAL` inside a transaction (`docs/database/sql/00_foundation.sql`, `07_rls_baseline.sql`; flow 23). The API runs on Cloudflare Workers (Hono), where each request is a short-lived isolate and direct TCP to Postgres is expensive. Targets: RPO 15 min, RTO 4 h (`docs/architecture/architecture/03-caching-operations.md`). Dependencies must be at least 7 days old (ADR 0005). Better Auth needs a database as well.

The product owner decided on **Neon Postgres reached from Workers through Hyperdrive**. This ADR verifies that choice against current documentation (consulted 2026-10-29) and fixes the configuration, so that #53, #54 and #56 can be implemented without re-deciding.

## Options considered

1. **Neon + Hyperdrive + `pg` (chosen)** — Hyperdrive pools connections near the database and removes TCP/TLS/auth round trips from the Worker. Standard Postgres wire protocol, so any `pg`-based layer works. Cons: Hyperdrive has a query cache that must be switched off for us; transaction-pooling semantics must be respected; extra moving part.
2. **Neon serverless driver (HTTP/WebSocket) without Hyperdrive** — Neon-native, but Cloudflare's own Neon guide says to use `pg` or postgres.js with a direct connection, not the Neon serverless driver, when using Hyperdrive. HTTP mode cannot hold a multi-statement transaction with `SET LOCAL`; WebSocket mode can, but adds a second pooling story. Not chosen.
3. **Another EU managed Postgres (e.g. a Dutch provider)** — could give an in-country region, but loses branch-per-PR, instant restore and the existing SQL baseline assumptions (`docs/database/`). Not chosen; revisit only if the Open items on residency fail legal review.

## Decision

### 1. Region and residency

- **Primary region: Neon `aws-eu-central-1` (Frankfurt).** Neon's current region list contains only two European regions, Frankfurt and London (`aws-eu-west-2`). **There is no region in the Netherlands.** Azure regions are deprecated for new projects. London is outside the EU (UK adequacy decision applies today, but it is a weaker position) and supports fewer products, so it is not used. Source: https://neon.com/docs/introduction/regions
- **Hyperdrive:** the connection pool is placed "in one or more regions closest to your origin database", so with a Frankfurt origin the pools sit near Frankfurt. The edge side of Hyperdrive terminates the driver connection near the Worker, wherever that Worker runs. Sources: https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/ and https://developers.cloudflare.com/hyperdrive/concepts/connection-lifecycle/
- **Not documented, therefore not assumed:** where Hyperdrive's query cache is stored, and whether Hyperdrive offers any EU-only guarantee. Query payloads transit Cloudflare's network (Workers run globally; placement hints are latency hints, not residency guarantees: https://developers.cloudflare.com/workers/configuration/placement/). Residency of the data **at rest** is Frankfurt; **in transit/processing** it is EU-pooled but Cloudflare-global. This is acceptable only if the Cloudflare DPA/SCCs and the privacy statement cover it. This goes to the legal review under Open items. Because candidate PII is additionally encrypted per record in the application layer (`docs/database/README.md`), Hyperdrive and Neon see ciphertext for the protected fields.
- **Worker placement:** set `placement.region = "aws:eu-central-1"` on the API Worker so multi-statement transactions run close to the pool (fewer round trips inside `BEGIN ... COMMIT`). Note it only affects `fetch` handlers and is a latency hint only. Verify in the PoC (#42).

### 2. Hyperdrive caching: disabled

- **Create the Hyperdrive configuration with caching disabled** (`wrangler hyperdrive create ... --caching-disabled`; the Wrangler 4.155 CLI exposes `--caching-disabled`, `--max-age`, `--swr`). Defaults would be `max_age` 60 s and `stale_while_revalidate` 15 s. Source: https://developers.cloudflare.com/hyperdrive/concepts/query-caching/
- **There is no per-query switch.** The docs only describe a second, cache-disabled configuration bound alongside a cached one. Since we have no use case for a cached configuration with tenant data, we bind **only one configuration, cache disabled**. Comments in SQL must never be used as cache controls.
- **Why this is a hard rule for us:** the cache is documented as keyed on the query (queries differing only in comment text share an entry). Our tenant isolation is _not_ in the query text: it is in the transaction setting `app.organization_id` evaluated by RLS. Two tenants running the identical `SELECT ... FROM candidates WHERE id = $1` could be treated as the same cacheable request. Whether the cache key includes bind parameters or session state is not documented, so we must not rely on it. (This keying inference is ours, from the docs; confirm with a test in #42 even though caching is off.)
- **Enforcement:**
  1. A CI check (script using the Cloudflare API or `wrangler hyperdrive get`) fails if the config reports caching enabled.
  2. Any future cached read (public marketing data, if ever) needs its own ADR and a separate binding named `HYPERDRIVE_CACHED_PUBLIC`, never wired into the tenant data layer.
- Hyperdrive caching does not apply to local runs that use `localConnectionString`, so cache bugs cannot be seen locally; this is another reason to keep it off.

### 3. Pooling mode, transactions and tenant context

Hyperdrive uses **transaction pooling**: a client holds one origin connection for the duration of a transaction, and the connection is **reset when returned to the pool**, so `SET` values do not carry over. One Worker invocation may use several origin connections over its lifetime. Source: https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/ and https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/

Consequences for the pattern:

- `BEGIN; SELECT set_config('app.organization_id', $1, true); ...; COMMIT;` applies to every statement in that transaction, because the whole transaction runs on one origin connection. `set_config(..., true)` is equivalent to `SET LOCAL` but accepts a bind parameter (plain `SET LOCAL` cannot be parameterized, which tempts string interpolation). The Hyperdrive and Neon docs describe `SET` inside a transaction and do not mention `SET LOCAL` by name; the Postgres semantics (value discarded at transaction end) are the standard ones and **must be proven by the integration test below, not assumed**.
- The transaction must be **explicit and driven by one client**: `BEGIN` and all statements on the same `pg` `Client` (not a `Pool` that may hand out different connections for each query). With Kysely this means `db.transaction()` on a dialect whose pool is limited to the single client of the request, or a thin wrapper that checks out one client.
- **Fail closed:** `app.current_organization_id()` returns NULL when the setting is empty, so `organization_id = NULL` matches no rows. Keep that, and in the helper throw if no tenant context was established. Reading outside `withTenant` must go through a different, narrow code path (identity/bootstrap), not through a default context.
- **Session-level `SET` / `RESET`:** do not use. It will be lost or leak to another request's transaction boundary. Anything that must be sticky goes to `ALTER ROLE ... SET` (e.g. `statement_timeout`, `idle_in_transaction_session_timeout`).
- **Prepared statements:** named prepared statements are supported with `pg` and `postgres.js`. Do not set `prepare: false` with postgres.js (Hyperdrive docs: can hang). SQL-level `PREPARE`/`EXECUTE` is not allowed; use driver parameterised queries only.
- **Not supported / not allowed:** session-level advisory locks (use `pg_advisory_xact_lock` inside a transaction, or a row lock, or a Durable Object / queue for coordination), `LISTEN`/`NOTIFY` (use Cloudflare Queues/outbox table polling, consistent with `outbox_events`), `WITH HOLD` cursors, temp tables with `ON COMMIT PRESERVE ROWS`, `LOAD`. These are limitations Neon documents for PgBouncer transaction mode (https://neon.com/docs/connect/connection-pooling); Hyperdrive's own pages are silent on advisory locks and LISTEN, so treat them as unsupported until proven otherwise.
- **Transactions must be short:** no external calls (KMS, HTTP, AI) inside; Hyperdrive caps queries at 60 s and the origin connection count (about 20 free, about 100 paid per configuration). Do KMS unwrap/decrypt outside the transaction, or after commit, on data already fetched. "Failed to acquire a connection from the pool" means exhaustion by long transactions. Source: https://developers.cloudflare.com/hyperdrive/platform/limits/
- **Neon connection string for Hyperdrive is the direct (non-pooled) endpoint**, not Neon's PgBouncer pooler, so there is exactly one pooler in the path. Source: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/

Pattern (sketch, to be implemented in `packages/database` by #56):

```ts
import { Client } from "pg";

type Membership = { organizationId: string; userId: string; role: string }; // already verified server-side

export async function withTenant<T>(
  env: { HYPERDRIVE: Hyperdrive },
  membership: Membership,
  fn: (q: Client["query"]) => Promise<T>,
): Promise<T> {
  // New client per request/transaction; never module-global (I/O cannot cross requests).
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    // Third argument true = transaction-local (same as SET LOCAL), value is bind-parameterised.
    await client.query("SELECT set_config('app.organization_id', $1, true)", [membership.organizationId]);
    // Optional: also set app.user_id for audit triggers.
    const result = await fn(client.query.bind(client));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    // Hyperdrive docs say the edge connection is cleaned up at request end;
    // closing explicitly is harmless and frees it sooner. Do not await in the hot path if latency matters:
    // ctx.waitUntil(client.end());
    await client.end().catch(() => undefined);
  }
}
```

Mandatory tests (acceptance for #56, run against real Postgres and, in CI, against a Neon branch through a Hyperdrive config):

1. Two parallel requests with different organizations never see each other's rows (repeat many times to exercise pool reuse).
2. After `COMMIT`, a new transaction without `withTenant` sees zero rows in every RLS table (setting does not leak).
3. A runtime-role connection cannot `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`, cannot `SET ROLE` to the owner, and `rolbypassrls = false`.
4. A rollback leaves no context behind.

### 4. Driver and query layer

- **Driver: `pg` (node-postgres).** Cloudflare's recommended driver for Hyperdrive, minimum 8.16.3, best caching/compatibility; `postgres` (postgres.js >= 3.4.5) is supported but secondary. Requires `nodejs_compat` (already set; from compatibility date 2026-08-04 it is on by default). Source: https://developers.cloudflare.com/hyperdrive/configuration/connect-to-postgres/
- **Lifecycle:** create the client (or a request-scoped pool with `max: 5` because Workers limit concurrent outbound connections) **inside the request handler**, never in module scope. Cloudflare states the edge connection is cleaned up when the request ends and `client.end()` is not required; we still end the client in `finally` for deterministic behaviour in tests and in queue consumers. Source: https://developers.cloudflare.com/hyperdrive/concepts/connection-lifecycle/
- **Query layer: Kysely on top of `pg` (`PostgresDialect`), with hand-written SQL migrations as the schema source of truth.**
  - Better Auth takes a `pg` pool or a Kysely instance natively (`database: { db: kysely, type: "postgres" }`), and its `@better-auth/kysely-adapter` ships as a dependency of `better-auth` (peer `kysely ^0.28.17 || ^0.29.0`). One Kysely instance and one connection per request can therefore serve both our repositories and Better Auth. Source: https://better-auth.com/docs/adapters/postgresql
  - Kysely is a typed query builder, not an ORM: it does not own the schema, which fits SQL-first migrations and RLS (policies, `FORCE ROW LEVEL SECURITY`, functions are things Drizzle's schema DSL does not model well). Raw SQL is available via the `sql` tag for anything awkward.
  - Types come from the database: generate `Database` interfaces from a migrated local Postgres (e.g. `kysely-codegen`, to be evaluated under #53) and check them into `packages/database`. CI fails if generated types differ from the committed ones.
  - **Rejected: Drizzle.** Better Auth has a Drizzle adapter, but Drizzle's value (schema-in-TypeScript plus `drizzle-kit` migrations) conflicts with forward-only numbered SQL, and its Better Auth route needs a Drizzle schema kept in sync with Better Auth's tables. Drizzle also pulls `pg` anyway. Revisit only if the team strongly prefers it.
  - **Rejected: raw SQL helper only.** Fine for a prototype; loses typed results and Better Auth would still need a Kysely or pool instance. (Raw `pg` remains the escape hatch inside `withTenant`.)
- **Better Auth and RLS:** Better Auth runs queries for users, sessions, accounts that are not organization-scoped (`07_rls_baseline.sql` states users/identities need a different bootstrap policy). Keep Better Auth's tables in a separate schema (`database.schemaName: "auth"`, which Better Auth supports), grant the runtime role only what it needs there, and do not enable the tenant policy on them. Better Auth's own `generate`/`migrate` CLI is **not** used to migrate production; its generated SQL is reviewed and committed as a numbered migration (see 6). Better Auth must use the same Hyperdrive connection, so its queries are also uncached.

### 5. Roles

Neon facts: roles created in the Console/CLI/API (including the default `neondb_owner`) are members of `neon_superuser`, which carries `BYPASSRLS`, `CREATEROLE`, `CREATEDB`; roles created with SQL are **not** in `neon_superuser` and start with only basic `public` privileges. Source: https://neon.com/docs/manage/roles

Design:

| Role                     | Created how                                                                      | Attributes                                                               | Used by                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `neondb_owner` (default) | Neon project creation                                                            | `neon_superuser`, BYPASSRLS                                              | Break-glass only. Credential stored in the team vault, not in CI or Workers. |
| `ts_owner`               | SQL migration, `NOLOGIN`                                                         | owns schemas, tables, functions                                          | Nobody connects; owns objects                                                |
| `ts_migrator`            | Console/API (needs a password) or SQL then `ALTER ROLE ... PASSWORD` out of band | member of `ts_owner`, `CREATEROLE` not needed; BYPASSRLS acceptable here | CI migration job over the direct endpoint only                               |
| `ts_app`                 | SQL, `LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB NOINHERIT`           | not owner, DML grants only                                               | **Hyperdrive and the API Worker**                                            |
| `ts_portal` (later)      | SQL                                                                              | narrower grants, separate service/path for share links                   | Share-link service (#54 "separate portal service path")                      |

- Migration 01 (to be written in #54) creates `ts_owner`, `ts_app` (and later `ts_portal`) via SQL, `GRANT USAGE` on schemas, `GRANT SELECT, INSERT, UPDATE, DELETE` per table (never `ALL`, no `TRUNCATE`, no DDL), `ALTER DEFAULT PRIVILEGES FOR ROLE ts_owner ...` so new tables get the right grants, and `ALTER ROLE ts_app SET statement_timeout`, `idle_in_transaction_session_timeout`, `lock_timeout`. **Passwords are never in migration files** (public repo): they are set out of band (`ALTER ROLE ... PASSWORD`) and stored in Cloudflare/GitHub secrets.
- **Create `ts_app` with SQL, never through the Neon Console**, otherwise it joins `neon_superuser` and gets BYPASSRLS. A CI test asserts `rolsuper = false AND rolbypassrls = false` for `ts_app`, that it owns no relation, and that it is not a member of `neon_superuser`.
- Neon limits: roles and passwords are per branch; child branches copy the parent's roles, but password resets are branch-scoped, and children of protected branches get newly generated passwords. CI branches therefore need `ts_app` passwords set explicitly after branch creation.
- The Postgres limitation recorded in `docs/database/README.md` remains: any connection of `ts_app` can run `set_config('app.organization_id', ...)` itself. RLS is defense in depth behind a trusted server, not a boundary against SQL-level compromise of the runtime credential.
- **Hyperdrive uses `ts_app`.** The Hyperdrive configuration holds that credential (stored in Cloudflare, not in the repo). `ts_migrator` is only ever used from CI over a direct connection.

### 6. Migrations

- Run over the **direct (non-pooled, non-Hyperdrive) Neon endpoint** as `ts_migrator`, from CI (and from a developer machine for local Docker). The credential is a GitHub Actions environment secret scoped to the deploy job; never given to Workers.
- Neon recommends direct connections for migrations, `pg_dump` and admin tasks (https://neon.com/docs/connect/connection-pooling).
- Tooling must support **forward-only, numbered, plain SQL, one transaction per file** (existing `docs/database/sql/NN_*.sql`) and be dependency-policy compatible. Shortlist for #53, to be decided there:
  1. **`dbmate`** (2.37.0, 2026-10-18): single binary, plain `.sql` with `-- migrate:up` sections, timestamp-prefixed; no down needed. Binary download needs checksum pinning.
  2. **`node-pg-migrate`** (9.0.0, 2026-07-17): npm package, SQL files supported, fits the pnpm catalog and 7-day policy automatically.
  3. **Own runner (~100 lines)** in `packages/database` using `pg`: apply `NNNN_name.sql` in order inside a transaction, record a SHA-256 checksum in `schema_migrations`, refuse to run if an applied file changed. Minimal supply-chain surface, no down migrations, trivially forward-only.
  - **Leaning:** the own runner or `node-pg-migrate` (stays in the TypeScript toolchain and pnpm catalog). Decide in #53. Reject Drizzle Kit / Prisma Migrate (own schema DSL) and Better Auth's CLI as the migration owner.
- Expand/migrate/contract: the API Worker is deployed _after_ additive migrations and the contract step happens in a later release; `ts_app` must never need DDL.
- Statements such as `CREATE INDEX CONCURRENTLY` cannot run inside a transaction: those migrations are explicitly marked non-transactional in the runner.
- Every PR runs the full migration set on a fresh Neon branch (flow 25, #35).

### 7. Local development (no cloud access)

- **Default: Postgres in Docker (a `compose.yaml` in the repo, `postgres:18`, pinned by digest), reached through Hyperdrive's local override.** In `wrangler.jsonc` the binding carries `localConnectionString` or, preferably (keeps it out of committed files), the environment variable `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` (suffix is the binding name `HYPERDRIVE`) in `.dev.vars`/shell. `wrangler dev` then connects straight to local Postgres. Source: https://developers.cloudflare.com/hyperdrive/get-started/
- Local mode **does not exercise Hyperdrive pooling or caching**, so transaction-pooling bugs are invisible. Therefore the tenant-context tests in section 3 are also run in CI against a Neon branch through a real Hyperdrive config (or at least against Neon's direct endpoint in a transaction-per-connection setup, plus PgBouncer in transaction mode as a cheap local approximation, to be evaluated in #42).
- Local setup creates the same roles (`ts_owner`, `ts_migrator`, `ts_app`) with throwaway passwords so RLS is really enforced locally (a superuser local connection would silently bypass RLS).
- Postgres.app is allowed but not documented/supported; a Neon dev branch per developer is **optional** (needs cloud credentials and holds a cost per branch) and must never be created from production data.
- Unit tests that do not need Postgres use fakes; RLS/tenancy tests need real Postgres. An embedded WASM Postgres (PGlite) is not adopted yet (single connection, cannot test pooling).

### 8. CI: Neon branch per PR (#35)

- Use Neon's GitHub Actions (`create-branch-action`, `delete-branch-action`, schema-diff) with a repository secret `NEON_API_KEY` and variable `NEON_PROJECT_ID`. Source: https://neon.com/docs/guides/branching-github-actions . Pin each action by commit SHA (ADR 0005 spirit) and give the Neon API key to a dedicated, least-privileged Neon organization member/API key.
- Name branches `ci/pr-<number>`; create on `opened`/`reopened`, delete on `closed`, and set **`expires_at`** (API/CLI branches have no expiry by default; Console branches default to 1 day) as a backstop against leaked branches, e.g. 3 days. Source: https://neon.com/docs/manage/branches
- **Parent must be a synthetic-data base branch (`ci-base`)**, not production. A branch copies the parent's data and roles, and a branch of production would copy candidate PII into a CI environment, violating AGENTS.md rule 3. Production is never a parent of any non-production branch.
- Cost: branches within the plan allowance are free; extra branches are $1.50 per branch-month prorated hourly, and compute is $0.106 (Launch) / $0.222 (Scale) per CU-hour while a branch endpoint is active; history storage on Launch/Scale is $0.20 per GB-month. Source: https://neon.com/docs/introduction/plans . With auto-delete on close and 5-minute scale-to-zero, a PR branch costs cents. Branch limits (10 on Launch, 25 on Scale per project) apply: concurrent open PRs beyond the cap fail, so the workflow must handle a creation error with a clear message. Use a separate Neon _project_ for CI so its limits and keys are isolated from production.

### 9. Backups, PITR and DR

- **History window (restore window):** Free 6 hours, Launch default 1 day / max 7 days, Scale default 1 day / max 30 days. Priced at $0.20 per GB-month on paid plans; configurable per project via `history_retention_seconds`. Sources: https://neon.com/docs/introduction/restore-window and https://neon.com/docs/introduction/plans
- **Restore:** instant restore of a root branch to any timestamp or LSN inside the window (millisecond granularity), via Console, CLI (`neon branches restore ... --preserve-under-name`) or API (`/branches/{id}/restore` with `source_timestamp`). The pre-restore state is kept automatically as `{branch}_old_{timestamp}`. Connection details stay the same, existing connections are briefly interrupted. A restore **overwrites** the branch; to inspect first, create a branch _from a past point_ (supported within the window), verify, then restore. Source: https://neon.com/docs/introduction/branch-restore
- **RPO 15 min:** point-in-time recovery is continuous (WAL based), so the achievable RPO is far smaller than 15 minutes for regional or accidental-change incidents, provided the incident is detected inside the window. Neon publishes no numeric RPO commitment for the whole-service or account-loss case, so the 15 min figure is **verified by drill, not by contract**.
- **RTO 4 h:** a restore is a metadata operation (not a data copy), so the database step takes minutes; the remaining RTO budget is detection, decision, application re-validation, and the **KMS/key recovery test** required by `03-caching-operations.md`. A restore drill (quarterly, starting before first customer data) measures actual time.
- **Plan decision:** production runs on **Scale** if the product owner accepts the cost, because it offers a 30 day window, IP Allow and the SOC 2 / ISO 27001 / GDPR documentation that D02 asked for; minimum for the pilot is **Launch with the window raised to 7 days**. The Free plan (6 h) is not acceptable for any real data.
- **Defense against Neon-side or account-level loss:** the history window is not an independent backup (project deletion or credential compromise removes it). Add a scheduled `pg_dump` over the direct endpoint, encrypted with a key held in the external KMS (not in Neon), written to an EU R2 bucket with a separate Cloudflare credential, retained per `retention_policies`. Restores of dumps must be drilled too. The GDPR erase process must account for dump retention (`docs/database/README.md` remaining work).
- Enable Neon protected-branch status for the production branch (paid plans) so it cannot be deleted or reset by mistake.

### 10. Versions (checked on npm 2026-10-29)

Policy: only releases at least 7 days old (ADR 0005).

| Package                       | Recommended | Published  | Age     | Note                                                                                                                                              |
| ----------------------------- | ----------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pg`                          | 8.23.1      | 2026-09-30 | 29 days | Cloudflare minimum is 8.16.3                                                                                                                      |
| `@types/pg`                   | 8.23.1      | 2026-08-17 | 73 days | Cloudflare minimum 8.13.0                                                                                                                         |
| `kysely`                      | 0.29.7      | 2026-10-17 | 12 days | `better-auth` peer: `^0.28.17 \|\| ^0.29.0`                                                                                                       |
| `better-auth`                 | 1.7.12      | 2026-10-20 | 9 days  | latest 1.7.14 (2026-10-26, 3 days) and 1.7.13 (2026-10-25, 4 days) are **still blocked** by the 7-day rule; 1.7.13 becomes eligible on 2026-11-01 |
| `postgres` (not used)         | 3.4.9       | 2026-04-05 |         | fallback only                                                                                                                                     |
| `drizzle-orm` (not used)      | 0.45.4      | 2026-10-08 |         | rejected                                                                                                                                          |
| `node-pg-migrate` (candidate) | 9.0.0       | 2026-07-17 |         | #53                                                                                                                                               |
| `dbmate` (candidate)          | 2.37.0      | 2026-10-18 |         | #53, binary                                                                                                                                       |

Pin exactly in the `catalog:` of `pnpm-workspace.yaml`. `pg` has no install scripts (dependencies include `pg-cloudflare`); no `allowBuilds` entry is expected. Wrangler 4.155.0 supports `hyperdrive create --caching-disabled`.

### Wrangler binding (placeholders only)

```jsonc
// apps/api/wrangler.jsonc (additions)
{
  "compatibility_flags": ["nodejs_compat"],
  "placement": { "region": "aws:eu-central-1" },
  "hyperdrive": [
    {
      "binding": "HYPERDRIVE",
      // ID of the configuration created with --caching-disabled (placeholder; real ID comes from the deploy environment).
      "id": "<HYPERDRIVE_CONFIG_ID>",
      // Local development only: prefer the env var
      // CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE in .dev.vars instead of committing this.
      "localConnectionString": "postgres://<LOCAL_USER>:<LOCAL_PASSWORD>@localhost:5432/talentstroom",
    },
  ],
}
```

Creation (run by a human with Cloudflare access; do not commit the output or connection string):

```sh
npx wrangler hyperdrive create talentstroom-<env> \
  --connection-string="postgres://ts_app:<PASSWORD>@<NEON_DIRECT_HOST>/<DB>?sslmode=require" \
  --caching-disabled
```

Separate Hyperdrive configurations for preview and production, each with its own Neon branch or project and its own `ts_app` password. Run `pnpm --filter @talentstroom/api cf-typegen` afterwards (AGENTS.md rule 9). The Neon host in the connection string must be the **non-pooled** hostname.

## Consequences

- **Easier:** short per-request Postgres connections from Workers; branch-per-PR and instant restore; one SQL-first migration source; Better Auth and our data layer share Kysely/`pg`.
- **Harder:** every tenant query must go through `withTenant` (a transaction per request); short transactions, with KMS and external calls outside; no LISTEN/NOTIFY or session advisory locks; local development does not reproduce pooling, so a Neon-branch integration test is mandatory.
- **Security:** query cache off by decision and checked in CI; runtime role cannot bypass RLS and is created via SQL so it is not `neon_superuser`; migration credentials are never on Workers; CI branches never descend from production data; Hyperdrive and Neon see only ciphertext for application-encrypted fields but see plaintext for the remaining non-encrypted columns (`docs/database/README.md` limitations 5 and 7 still apply).
- **Privacy/residency:** data at rest in Frankfurt; Cloudflare processes traffic globally. Sub-processor chain: Neon (Databricks-owned, AWS), Cloudflare, AWS. Legal review required before production data (Open items).
- **Cost:** Neon Launch/Scale usage pricing (compute, storage, $0.20/GB-month history, $1.50/extra branch-month); Hyperdrive is included with Workers plans (paid plan: about 100 origin connections, 25 configs); Hyperdrive/Workers pricing for production should be checked at purchase time.

## Rollback

- The application only depends on standard Postgres wire protocol, SQL migrations and Kysely/`pg`. Moving off **Hyperdrive** means swapping `env.HYPERDRIVE.connectionString` for a direct Neon string (preferably the Neon pooler endpoint) in one factory function; cost is higher connection latency from Workers.
- Moving off **Neon** means `pg_dump`/restore into another Postgres (EU) and updating the Hyperdrive origin; no code change except role/branch automation in CI. Cost: days of work plus a data-migration window, and loss of branch-per-PR (replace with ephemeral Docker Postgres).
- Dropping Kysely for Drizzle or raw SQL is confined to `packages/database` and Better Auth configuration.

## Open items

1. **Legal/DPA (blocks real customer data):** Neon and Cloudflare DPAs, SCCs, sub-processor lists; written confirmation of where Hyperdrive's query cache and edge connection termination run; decision whether "at rest in Frankfurt, in transit via Cloudflare" is acceptable for D02. Also decide Neon Frankfurt vs a non-AWS Dutch provider if legal says "Netherlands only".
2. **Plan choice:** Launch (7 day window) vs Scale (30 days, IP Allow, compliance reports). Pricing and Scale's SOC 2/ISO documents to be confirmed against Neon's current pricing page at purchase time. Note IP Allow does not combine trivially with Hyperdrive (no fixed egress IP documented); alternatives are strong roles/TLS or Hyperdrive over Cloudflare Access/Tunnel. Needs a spike.
3. **PoC (#42):** measure p50/p95 for a read plus decrypt from a Worker (Frankfurt placement vs none), confirm `set_config(..., true)` isolation under concurrency through a real Hyperdrive config on Neon, confirm no cross-tenant cache behaviour with caching disabled, confirm `placement.region` effect with Hyperdrive.
4. **Scale-to-zero:** Neon suspends idle computes after 5 minutes and wakes in "a few hundred ms" (https://neon.com/docs/manage/computes). Hyperdrive's initial connect timeout is 15 s so it should survive, but production should disable scale-to-zero (always-active compute) if p95 or error rate suffers; preview/CI keep it on.
5. **Migration runner** choice (own runner vs `node-pg-migrate` vs `dbmate`) and `kysely-codegen` evaluation: #53.
6. **Better Auth schema:** `auth` schema vs tables in `public`, which Better Auth plugins (organization plugin?) we use, and how its membership tables relate to our `memberships`. Needs ADR with the auth decision; avoid duplicating membership truth.
7. **RLS policy review:** the sample `07_rls_baseline.sql` has no policy for identity tables, the portal role or `app.user_id`; #54 and a security review must finish it. Consider `FORCE ROW LEVEL SECURITY` plus a non-owner runtime (already planned).
8. **Pooling-sensitive features:** confirm that `pg_advisory_xact_lock` and protocol-level named prepared statements behave through Hyperdrive on Neon, since Hyperdrive docs do not list them explicitly.
9. **Backup drill:** schedule the first restore drill (including KMS key recovery and R2 dump restore) before onboarding the first customer; define alerting when the history window is shorter than configured.
10. **Supply chain:** decide whether to pin the Neon GitHub Actions by SHA and who owns the Neon API key; consider a Neon organization with SSO.
11. **Hyperdrive config guard in CI** (caching disabled) needs a Cloudflare API token with read-only Hyperdrive scope; define where it is stored.
