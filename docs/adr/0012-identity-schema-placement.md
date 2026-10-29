# 0012 — Identity schema placement: organizations and memberships in `app`

- **Status:** Accepted (approved by merging PR)
- **Date:** 2026-10-29
- **Resolves:** ADR 0007 open item 6 (Better Auth schema), naming entries "decided in #55" in `docs/database/README.md`
- **Issue:** #55 (builds on #52, ADR 0006, ADR 0007)

## Context

ADR 0006 puts Better Auth 1.7.12 in the API Worker with its own Postgres role `ts_auth` (binding `HYPERDRIVE_AUTH`) and keeps `ts_app` (binding `HYPERDRIVE`) away from credential tables. `0001_roles.sql` gives each role one schema: `ts_auth` gets DML on everything in `auth`, `ts_app` on everything in `app`, through default privileges.

Three Better Auth models do not fit cleanly on one side: `organizations`, `memberships` and `organization_invitations`.

- Better Auth writes them (organization plugin).
- Every tenant domain table references them: `organization_id → organizations(id)` and `(organization_id, *_membership_id) → memberships(organization_id, id)`.
- The request middleware resolves session and membership through the auth connection (ADR 0006, section 6 of the design doc). Domain code under `ts_app` still needs to read memberships for joins and tenant checks, under RLS with `app.current_organization_id()`.
- `ts_app` must never reach password hashes, TOTP secrets, passkeys, sessions, accounts or verifications.

## What Better Auth 1.7.12 supports (verified)

- **One schema for all models:** `database.schemaName` (PostgreSQL only) wraps the Kysely instance in `withSchema(schemaName)`, which qualifies every table name that is not already qualified. Source: `@better-auth/kysely-adapter@1.7.12` `dist/index.mjs`, `createKyselyAdapter`; option documented in `@better-auth/core` `types/init-options.d.mts`. There is no per-model `schema` option.
- **Schema-qualified `modelName`:** a model name such as `app.memberships` is passed to Kysely unchanged. Kysely parses `schema.table` in `selectFrom`/`insertInto`/`updateTable` and `schema.table.column` in references, and `withSchema` leaves an already qualified table alone. The adapter also splits dotted join model names (`joinModel.split(".")`). This is not documented as a feature, so we verified it at runtime:
  - Better Auth 1.7.12 + `@better-auth/passkey` 1.7.12 + Kysely 0.29.7 + `pg` 8.23.1, connected as `ts_auth` to a scratch database migrated with `0001`–`0003`, configuration as below with `validateSchema: true`: sign-up, sign-in, `createOrganization` (creator becomes `owner`, `active_organization_id` set), `createInvitation`, `cancelInvitation`, `listMembers`, `listOrganizations`, `getFullOrganization` (joins), `enableTwoFactor`, `requestPasswordReset` (hashed verification identifier), HTTP sign-in with the database rate limiter, `deleteOrganization` (404 with `disableOrganizationDeletion`), sign-out. All passed; the runtime schema check reported no findings.
  - Negative check: renaming one mapped column in `sessions` and one in `app.memberships` made the runtime schema check fail with both columns listed, so the check covers the `app.*` tables.
- **CLI limitation:** Better Auth's migration planner (`getMigrations`, used by `auth generate`/`auth migrate`) looks up every table in `schemaName` and reports `app.organizations`, `app.memberships`, `app.organization_invitations` as missing. We never run `auth migrate` (ADR 0006), but the planned CI drift check must use the **runtime schema check** (`validateSchema: true` against the migrated database), not `auth generate`.

## Options considered

1. **A — all identity models in `auth`.** Better Auth needs no schema tricks. But `ts_app` then needs `USAGE` on `auth` plus table grants on two tables in the schema that holds every credential; only table grants separate domain code from password hashes. Every domain table gets a cross-schema FK into `auth`, and tenant RLS policies live in the credential schema.
2. **B — `organizations`, `memberships`, `organization_invitations` in `app`; credentials in `auth` (chosen).** `ts_app` keeps zero access to the `auth` schema, so a mistaken table grant in `auth` still exposes nothing (no `USAGE`). The tenant root and the membership key that domain tables reference live next to them. `ts_auth` gets `USAGE` on `app` and explicit grants on exactly three tables; default privileges in `app` never include `ts_auth`, so new domain tables stay closed to it. Costs: Better Auth relies on schema-qualified `modelName`s (verified above, not documented) and the CLI planner cannot be used for drift detection.
3. **C — everything in one schema (`public`/`app`) with per-table grants.** Simplest for Better Auth, but loses the schema boundary for credentials entirely. Rejected.

Why B over A: the role that runs all domain code (and therefore has the largest SQL-injection and bug surface) is `ts_app`. Keeping it out of the credential schema altogether is a stronger guarantee than table grants inside it. `ts_auth` is used by a small, well-defined code path, so giving it three explicit tables in `app` is the cheaper trust to extend.

## Decision

### Placement and access

| Schema | Table                      | `ts_auth`                        | `ts_app`                                                         |
| ------ | -------------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `auth` | `users`                    | DML                              | none (no `USAGE` on `auth`)                                      |
| `auth` | `sessions`                 | DML                              | none                                                             |
| `auth` | `auth_accounts`            | DML                              | none                                                             |
| `auth` | `auth_verifications`       | DML                              | none                                                             |
| `auth` | `auth_passkeys`            | DML                              | none                                                             |
| `auth` | `auth_two_factors`         | DML                              | none                                                             |
| `auth` | `auth_rate_limits`         | DML                              | none                                                             |
| `auth` | `auth_security_events`     | `SELECT`, `INSERT` (append-only) | none                                                             |
| `app`  | `organizations`            | `SELECT`, `INSERT`, `UPDATE`     | `SELECT`, RLS: `id = app.current_organization_id()`              |
| `app`  | `memberships`              | `SELECT`, `INSERT`, `UPDATE`     | `SELECT`, RLS: `organization_id = app.current_organization_id()` |
| `app`  | `organization_invitations` | `SELECT`, `INSERT`, `UPDATE`     | none                                                             |
| `app`  | domain tables (later)      | none                             | DML under tenant RLS                                             |

- **No `DELETE` on organizations, memberships, invitations for `ts_auth`.** Members are suspended (`state = 'suspended'`), organizations change `state`; history referenced by domain rows is never deleted. Better Auth paths that would delete are disabled (configuration below), and the missing grant makes any leftover path fail closed.
- **Identity writes go through `ts_auth`** (Better Auth and our `/v1` identity endpoints, e.g. suspend member, organization settings). `ts_app` only reads. If domain code later must write organization settings, add a column-level `UPDATE` grant in a reviewed migration.
- **RLS is enabled and forced on all eleven tables.** `ts_auth` has a permissive policy (`USING (true)`): authentication runs before a tenant is chosen and the organization plugin reads across organizations (listing a user's organizations, invitations). `ts_app` has tenant `SELECT` policies on `organizations` and `memberships` only. Every other role has no policy and therefore sees no rows, even if a grant is added by mistake.
- **`users` and `sessions` are not tenant-scoped:** a person signs in once, before choosing an organization, and can be a member of several. The chosen tenant is `sessions.active_organization_id`, checked against an active membership on every request.
- **Composite keys:** `memberships UNIQUE (organization_id, id)` and `organization_invitations UNIQUE (organization_id, id)` are the targets for tenant-safe FKs from domain tables. Foreign-key checks run as the table owner without RLS, so `ts_app` can insert domain rows that reference memberships while still seeing only its own tenant.
- **Secrets:** password hashes (scrypt), OAuth tokens (`encryptOAuthTokens`), TOTP secrets and backup codes (`storeBackupCodes: "encrypted"`) are stored hashed or encrypted by Better Auth. Verification identifiers are stored as SHA-256 hashes (`verification.storeIdentifier: "hashed"`). Session tokens cannot be hashed in 1.7.12 (no option in `internal-adapter`); the session cookie carries an HMAC signature over the token made with `BETTER_AUTH_SECRET`, so a database dump alone does not yield a usable cookie. The invitation id is the link token; accepting needs a signed-in user with the matching, verified email.
- **Guard rails in the schema:** role `CHECK (owner|admin|recruiter|viewer)` on memberships and invitations (also rejects Better Auth's default `member` and comma-separated roles), `platform_role IN ('user', 'platform-support')`, `sessions.impersonated_by IS NULL` (D12), membership `state IN ('active', 'suspended')`.

### Better Auth configuration (copy into the integration task)

Only the schema-relevant parts; the rest is in `04-identity-better-auth.md` section 4. This exact mapping passed the runtime check described above.

```ts
import { PostgresDialect } from "kysely";
import { Pool } from "pg";

const pool = new Pool({ connectionString: env.HYPERDRIVE_AUTH.connectionString, max: 1 });

betterAuth({
  // Unqualified model names resolve to `auth`; `app.*` model names stay in `app`.
  database: { dialect: new PostgresDialect({ pool }), type: "postgres", schemaName: "auth", transaction: true },
  advanced: { database: { generateId: "uuid", validateSchema: false } }, // true in the CI schema check
  user: {
    modelName: "users",
    fields: {
      name: "display_name",
      emailVerified: "email_verified",
      image: "image_url",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    modelName: "sessions",
    fields: {
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    cookieCache: { enabled: false },
    additionalFields: {
      authMethod: { type: "string", required: false, input: false, fieldName: "auth_method" },
      lastSeenAt: { type: "date", required: false, input: false, fieldName: "last_seen_at" },
      lockedAt: { type: "date", required: false, input: false, fieldName: "locked_at" },
    },
  },
  account: {
    modelName: "auth_accounts",
    encryptOAuthTokens: true,
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    modelName: "auth_verifications",
    storeIdentifier: "hashed",
    fields: { expiresAt: "expires_at", createdAt: "created_at", updatedAt: "updated_at" },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "auth_rate_limits",
    fields: { lastRequest: "last_request" },
  },
  disabledPaths: [
    // in addition to ADR 0006: everything that deletes memberships or organizations
    "/organization/set-active",
    "/organization/delete",
    "/organization/leave",
    "/organization/remove-member",
    /* …admin paths from ADR 0006… */
  ],
  plugins: [
    organization({
      /* ac, roles, creatorRole: "owner", … (ADR 0006) */
      disableOrganizationDeletion: true,
      organizationHooks: { beforeRemoveMember: refuseDeleteUseSuspend /* our /v1 endpoint suspends */ },
      schema: {
        organization: { modelName: "app.organizations", fields: { logo: "logo_url", createdAt: "created_at" } },
        member: {
          modelName: "app.memberships",
          fields: { organizationId: "organization_id", userId: "user_id", createdAt: "created_at" },
          additionalFields: { state: { type: "string", required: false, input: false, defaultValue: "active" } },
        },
        invitation: {
          modelName: "app.organization_invitations",
          fields: {
            organizationId: "organization_id",
            expiresAt: "expires_at",
            inviterId: "inviter_id",
            createdAt: "created_at",
          },
        },
        session: { fields: { activeOrganizationId: "active_organization_id" } },
      },
    }),
    twoFactor({
      backupCodeOptions: { storeBackupCodes: "encrypted" },
      schema: {
        user: { fields: { twoFactorEnabled: "two_factor_enabled" } },
        twoFactor: {
          modelName: "auth_two_factors",
          fields: {
            backupCodes: "backup_codes",
            userId: "user_id",
            failedVerificationCount: "failed_verification_count",
            lockedUntil: "locked_until",
          },
        },
      },
    }),
    passkey({
      schema: {
        passkey: {
          modelName: "auth_passkeys",
          fields: {
            publicKey: "public_key",
            userId: "user_id",
            credentialID: "credential_id",
            deviceType: "device_type",
            backedUp: "backed_up",
            createdAt: "created_at",
          },
        },
      },
    }),
    admin({
      /* platform roles (ADR 0006 section 8) */
      schema: {
        user: { fields: { role: "platform_role", banReason: "ban_reason", banExpires: "ban_expires" } },
        session: { fields: { impersonatedBy: "impersonated_by" } },
      },
    }),
  ],
});
```

Notes for the integration task:

- `database: pool` (as in the ADR 0006 sketch) has no `schemaName`; use the `dialect` form above. The `{ db: kysely }` form leaves `transaction` off unless set.
- Organization columns `locale`, `timezone`, `state`, `settings`, `updated_at` and membership `updated_at` are not declared to Better Auth; DB defaults fill them and our `/v1` endpoints write them through `ts_auth`.
- Teams stay disabled: no `team_id` / `active_team_id` columns. Enabling teams needs a migration.

## Consequences

- **Easier:** domain migrations reference `app.organizations` and `app.memberships` within their own schema; tenant RLS for identity rows uses the same `app.current_organization_id()` as domain tables; the `auth` schema is a hard boundary for `ts_app`.
- **Harder:** we depend on undocumented behaviour (schema-qualified `modelName`). A Better Auth upgrade could break it; the CI runtime schema check plus an end-to-end auth test catch that. Better Auth's CLI planner cannot be used for drift detection.
- **Security:** `ts_app` has no path to credentials (schema `USAGE`, table grants and RLS all deny). `ts_auth` can read memberships across organizations by design and can read and write organization rows, but cannot delete them and cannot reach domain tables. Session tokens are stored as issued (library limitation); mitigated by signed cookies, short session lifetime and the DB-leak runbook (rotate `BETTER_AUTH_SECRET`, revoke all sessions).
- **Cost:** none beyond two extra grants and policies; the per-request lookups (session by token, membership by `(organization_id, user_id)`) are covered by unique indexes.

## Rollback

Moving the three tables to `auth` is a forward migration (`ALTER TABLE … SET SCHEMA auth`, adjust grants and policies) plus dropping the `app.` prefix from three `modelName`s. Foreign keys follow the tables automatically. Cost: about a day including tests, no data migration.
