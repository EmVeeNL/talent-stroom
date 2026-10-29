# 04 — Identity with Better Auth: detailed design

Status: design for [ADR 0006](../../adr/0006-identity-better-auth.md) (issue #19), with a schema proposal for #52. Research date: 2026-10-29, against Better Auth **1.7.12**. Claims about Better Auth that cite `source:` were read from the published 1.7.12 npm tarball, not from the documentation.

## 1. Scope

Better Auth runs inside the existing `apps/api` Hono Worker and owns authentication: email and password, email verification, password reset, Google, Apple and Microsoft sign-in, passkeys, TOTP with backup codes, sessions, organizations, memberships and invitations. TalentStroom code stays responsible for:

- authorization of every `/v1` organization-scoped request (AGENTS.md rule 2),
- the tenant context in Postgres (`app.current_organization_id()` and RLS),
- organization policies (require MFA, allowed sign-in methods, idle lock),
- security and audit events,
- email delivery and Dutch templates.

Out of scope for the MVP: enterprise SSO (SAML or per-organization OIDC) and SCIM. See section 10.

## 2. Runtime on Cloudflare Workers

| Topic | Finding | Source |
|---|---|---|
| Hono | Mount `auth.handler(c.req.raw)` on the auth base path; no adapter is needed because both use Web `Request`/`Response`. CORS must have an explicit origin and `credentials: true`. | https://www.better-auth.com/docs/integrations/hono |
| Compatibility flags | Better Auth needs `AsyncLocalStorage`: `nodejs_compat` (or `nodejs_als`). Our `wrangler.jsonc` already sets `nodejs_compat`; Cloudflare also enables it by default for compatibility dates from 2026-08-04. | https://www.better-auth.com/docs/installation, https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/ |
| Password hashing | Default is scrypt (N=16384, r=16, p=1, 64-byte key). `@better-auth/utils/password` exports a `workerd` condition that maps to `node:crypto` `scrypt`; without it, it falls back to pure-JS `@noble/hashes`. Wrangler bundles with the `workerd` condition, so we get the `node:crypto` implementation. scrypt is supported in Workers `node:crypto` (argon2 is not). | source: `@better-auth/utils@0.5.0` `package.json` exports and `dist/password*.mjs`; https://developers.cloudflare.com/workers/wrangler/bundling/; https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/ |
| Hashing cost | One native scrypt hash with these parameters took about 62 ms on a developer laptop (Node 26, `crypto.scryptSync`; not measured in workerd). The scrypt memory use is 128·N·r = 32 MiB per hash, against a 128 MB isolate limit shared by concurrent requests. | local measurement 2026-10-29; https://developers.cloudflare.com/workers/platform/limits/ |
| CPU limits | Workers Free: 10 ms CPU per request, not configurable. Workers Paid: 30 s default, up to 5 min via `limits.cpu_ms`. **Workers Paid is required** for password sign-in. | https://developers.cloudflare.com/workers/platform/limits/ |
| Custom hashing | `emailAndPassword.password.hash` / `verify` replace scrypt (the docs show Argon2). | https://www.better-auth.com/docs/authentication/email-password, https://www.better-auth.com/docs/reference/security |

**Hashing decision.** Keep the default scrypt for now. It runs natively, it is memory-hard, and changing it later is a `password.verify` fallback plus rehash on login. Before launch, measure CPU time and memory in workerd under concurrent sign-ins (follow-up issue). Argon2id is not available in Workers `node:crypto`; a WebAssembly Argon2 or a separate hashing Worker only if the measurement fails.

### Known Workers issues (open upstream at the time of writing)

- **Hanging init promises** — [better-auth#10315](https://github.com/better-auth/better-auth/issues/10315): Better Auth caches promises across requests (the `node:async_hooks` dynamic import, the lazy initialization). On Workers, a promise created in a request that the client aborts never settles, so every later auth call in that isolate hangs. Confirmed by several reporters, including Hono + Hyperdrive. The fix ([PR #11482](https://github.com/better-auth/better-auth/pull/11482)) is not merged. Mitigation: (1) pre-seed the three `AsyncLocalStorage` instances at module scope of the Worker entry, as described in the issue; (2) create the `betterAuth()` instance per request, so no init promise outlives its request.
- **Runtime schema check** — [better-auth#11651](https://github.com/better-auth/better-auth/issues/11651): the default runtime schema check (`advanced.database.validateSchema`, on by default) caches a pending promise per adapter instance. With a per-request instance it would instead run an introspection query on every request (source: `@better-auth/core` `dist/db/schema-check.mjs`). Set `validateSchema: false` in the Worker and run the schema check in CI against the migrated database instead.

### Instance per request

Workers cannot reuse I/O objects across requests, and the Hyperdrive guide creates a new `pg` client per request ("Hyperdrive maintains the underlying database connection pool"): https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/. We therefore build the Better Auth instance (and its `pg` pool with `max: 1`) per request in a Hono middleware and close the pool with `executionCtx.waitUntil`. Measure the construction cost in the spike; caching the *options object* at module scope is fine, caching the instance is not.

## 3. Database access

- **Adapter:** the built-in Kysely adapter with a `pg` `Pool` (Better Auth wraps it in Kysely's `PostgresDialect`; source: `@better-auth/kysely-adapter` `dist/index.mjs`). No Drizzle: we do not otherwise use an ORM, and `migrate` and `generate --sql` only exist for the Kysely adapter (https://www.better-auth.com/docs/concepts/database).
- **Driver:** `pg` ≥ 8.16.3 is required by Hyperdrive (same Hyperdrive page). Catalog candidate: `pg` 8.23.1.
- **Hyperdrive query caching must be off for auth.** Hyperdrive caches read queries for 60 s by default (plus 15 s stale-while-revalidate) and does not invalidate on writes; Cloudflare recommends a cache-disabled configuration for sessions and permissions: https://developers.cloudflare.com/hyperdrive/concepts/query-caching/. A cached `SELECT` on `sessions` or `memberships` would keep a revoked session or membership valid for up to 75 s. Use a dedicated binding `HYPERDRIVE_AUTH`, created with `--caching-disabled`.
- **Connection pooling:** Hyperdrive pools in transaction mode and `RESET`s connections, so `SET` state does not survive a transaction (https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/). Auth queries do not need tenant context; domain queries must set it inside each transaction (outside this ADR).
- **Limits:** about 100 origin connections per Hyperdrive configuration on Paid, 60 s maximum query duration: https://developers.cloudflare.com/hyperdrive/platform/limits/.
- **IDs:** `advanced.database.generateId: "uuid"` makes generated columns `uuid` in Postgres (source: `better-auth` `dist/db/get-migration.mjs`; option documented at https://www.better-auth.com/docs/reference/options).
- **Migrations:** run `auth generate` (the CLI package is `auth`) to produce SQL, review it, rename tables and columns per section 5, and commit it as a numbered forward-only migration in our runner. Never run `auth migrate` against shared environments. Every Better Auth upgrade runs `generate` against a migrated database in CI; a non-empty diff fails the build until a migration is added.

## 4. Configuration sketch (illustrative, not final code)

```ts
// apps/api/src/identity/auth.ts — illustrative only
import { AsyncLocalStorage } from "node:async_hooks";
import { betterAuth } from "better-auth";
import { admin, organization, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { Pool } from "pg";
import { ac, roles } from "./access-control"; // owner, admin, recruiter, viewer
import { platformAc, platformRoles } from "./platform-access-control"; // see section 8

// Workaround for better-auth#10315: seed at isolate start-up, never inside a request.
const g = ((globalThis as any)[Symbol.for("better-auth:global")] ??= { version: "", epoch: 1, context: {} });
g.context.adapterAsyncStorage ??= new AsyncLocalStorage();
g.context.requestStateAsyncStorage ??= new AsyncLocalStorage();
g.context.endpointContextAsyncStorage ??= new AsyncLocalStorage();

export function createAuth(env: Env, ctx: ExecutionContext) {
  // Per request; the Hono middleware calls ctx.waitUntil(pool.end()) after the handler returns.
  const pool = new Pool({ connectionString: env.HYPERDRIVE_AUTH.connectionString, max: 1 });

  return betterAuth({
    appName: "TalentStroom",
    baseURL: env.AUTH_BASE_URL,           // explicit; never inferred from the request
    basePath: "/v1/auth",
    secret: env.BETTER_AUTH_SECRET,        // Workers secret, never in wrangler.jsonc
    database: pool,
    trustedOrigins: [env.WEB_ORIGIN, "https://appleid.apple.com"],
    telemetry: { enabled: false },         // default is already false; keep explicit

    advanced: {
      database: { generateId: "uuid", validateSchema: false },
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      useSecureCookies: true,
      cookiePrefix: "ts",
      backgroundTasks: { handler: (p: Promise<unknown>) => ctx.waitUntil(p) },
    },

    user: { modelName: "users", fields: { name: "display_name", emailVerified: "email_verified" /* … */ } },
    session: {
      modelName: "sessions",
      expiresIn: 60 * 60 * 12,             // absolute-ish lifetime, refreshed by updateAge
      updateAge: 60 * 60,
      freshAge: 60 * 15,                   // passkey enrolment, 2FA changes, session list
      cookieCache: { enabled: false },     // immediate revocation (section 7)
      additionalFields: { lockedAt: { type: "date", required: false, input: false },
                          authMethod: { type: "string", required: false, input: false } },
    },
    account: {
      modelName: "auth_accounts",
      encryptOAuthTokens: true,
      accountLinking: { enabled: true, trustedProviders: ["google"] }, // verify before launch
    },
    verification: { modelName: "auth_verifications" },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => { ctx.waitUntil(sendMail(env, "reset", user, url)); },
    },
    emailVerification: {
      sendOnSignUp: true,
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }) => { ctx.waitUntil(sendMail(env, "verify", user, url)); },
    },

    socialProviders: {
      google:    { clientId: env.GOOGLE_CLIENT_ID,    clientSecret: env.GOOGLE_CLIENT_SECRET },
      apple:     { clientId: env.APPLE_SERVICE_ID,    clientSecret: env.APPLE_CLIENT_SECRET_JWT },
      microsoft: { clientId: env.MS_CLIENT_ID, clientSecret: env.MS_CLIENT_SECRET, tenantId: "common" },
    },

    rateLimit: { enabled: true, storage: "database", modelName: "auth_rate_limits" },

    // Raw endpoints we replace with /v1 wrappers or do not offer over HTTP at all.
    disabledPaths: [
      "/organization/set-active",          // replaced by POST /v1/organizations/{orgId}/switch
      "/admin/impersonate-user", "/admin/stop-impersonating",
      "/admin/set-user-password", "/admin/create-user", "/admin/update-user",
      "/admin/set-role", "/admin/remove-user", "/admin/list-users", "/admin/get-user",
      "/admin/list-user-sessions",
    ],

    databaseHooks: { session: { create: { before: bindSingleOrganization } } },
    hooks: { after: recordSecurityEvents },  // writes auth_security_events

    plugins: [
      organization({
        ac, roles, creatorRole: "owner",
        allowUserToCreateOrganization: async (user) => user.emailVerified,
        invitationExpiresIn: 60 * 60 * 24 * 7,
        requireEmailVerificationOnInvitation: true,
        cancelPendingInvitationsOnReInvite: true,
        sendInvitationEmail: async (data) => { ctx.waitUntil(sendMail(env, "invite", data)); },
        schema: { organization: { modelName: "organizations" }, member: { modelName: "memberships" },
                  invitation: { modelName: "organization_invitations" } },
        organizationHooks: {
          beforeCreateInvitation: assertSeatAvailable,       // BILL-01 seat entitlement
          afterRemoveMember: clearOrgFromUserSessions,       // section 7
          afterUpdateMemberRole: recordRoleChange,
        },
      }),
      twoFactor({ issuer: "TalentStroom", backupCodeOptions: { storeBackupCodes: "encrypted" },
                  schema: { twoFactor: { modelName: "auth_two_factors" } } }),
      passkey({ rpID: env.PASSKEY_RP_ID, rpName: "TalentStroom", origin: env.WEB_ORIGIN,
                schema: { passkey: { modelName: "auth_passkeys" } } }),
      admin({ ac: platformAc, roles: platformRoles, defaultRole: "user", adminRoles: ["platform-support"],
              adminUserIds: [], schema: { user: { fields: { role: "platform_role" } } } }),
    ],
  });
}
```

Key options and their sources:

- Sessions: `expiresIn` (default 7 days), `updateAge` (1 day), `freshAge` (1 day), `cookieCache` (off by default; revoked sessions stay valid until the cache expires if on): https://www.better-auth.com/docs/concepts/session-management, https://www.better-auth.com/docs/reference/options.
- `freshAge` gates passkey registration and session listing (`freshSessionMiddleware`) and 2FA changes (`sensitiveSessionMiddleware`) (source: `@better-auth/passkey` `dist/index.mjs`, `better-auth` `dist/api/routes/session.mjs`). Because `freshAge` is global, a short value also means listing devices needs a recent sign-in. 15 minutes is a starting point.
- Email verification default `expiresIn` 3600 s; reset token 3600 s; `revokeSessionsOnPasswordReset` default `false`: https://www.better-auth.com/docs/reference/options.
- Rate limiting: on in production, default 100 requests per 10 s, `/sign-in/email` and `/two-factor/*` 3 per 10 s; memory storage is unsuitable for serverless: https://www.better-auth.com/docs/concepts/rate-limit. Use `database` storage, plus a Cloudflare WAF rate-limit rule on `/v1/auth/*` as the outer layer.
- CSRF: Origin check against `trustedOrigins`, Fetch Metadata on first sign-in; `disableCSRFCheck` and `disableOriginCheck` stay off: https://www.better-auth.com/docs/reference/security.
- IP header: default `x-forwarded-for`; set `cf-connecting-ip`: https://www.better-auth.com/docs/reference/security.
- Backup codes: 10 codes by default, stored as **plain JSON** unless `storeBackupCodes: "encrypted"` (source: `better-auth` `dist/plugins/two-factor/backup-codes/index.mjs`). We set `"encrypted"`.
- `disabledPaths` returns 404 for HTTP calls to those paths; server-side `auth.api.*` calls still work (source: `better-auth` `dist/api/index.mjs`, `onRequest`).

## 5. Schema reconciliation (#52)

### Principles

1. Better Auth tables use our naming: plural `snake_case` table names via `modelName`/`schema`, `snake_case` columns via `fields`. Better Auth keeps camelCase in TypeScript; type inference keeps the original names (https://www.better-auth.com/docs/concepts/database).
2. All IDs are `uuid` (`generateId: "uuid"`). This matches `organizations.id`, `users.id` and every domain table.
3. Names follow the SQL baseline (`users`, `memberships`), not `02-data-multitenancy.md` (`identities`, `organization_memberships`). #52 updates that doc.
4. Better Auth's SQL output is the starting point of a migration, never applied unreviewed.

### Table mapping

| Better Auth model | Our table | Notes |
|---|---|---|
| `user` | `users` | `name`→`display_name`, `emailVerified`→`email_verified`, `image`→`image_url`. Keep `users_email_unique` on `lower(email)`. Admin plugin adds `role`→`platform_role`, `banned`, `ban_reason`, `ban_expires`; twoFactor adds `two_factor_enabled`. **Drop `users.state`**: `banned` is the platform-level disable. |
| `session` | `sessions` | `token` unique, `expires_at`, `ip_address`, `user_agent`, `user_id`; plugins add `active_organization_id`, `active_team_id` (unused), `impersonated_by` (unused, see section 8); ours: `locked_at`, `auth_method`. No RLS. |
| `account` | `auth_accounts` | **Replaces `auth_identities`.** `(provider_id, account_id)` unique (replaces `UNIQUE(provider, provider_subject)`). Holds the password hash (`password`) and OAuth tokens (encrypted with `encryptOAuthTokens`). |
| `verification` | `auth_verifications` | Email verification, reset, OAuth state. Short-lived; purge expired rows with a scheduled job. |
| `organization` | `organizations` | Better Auth fields `name`, `slug`, `logo`→`logo_url`, `metadata` (text, unused), `createdAt`. Our columns `locale`, `timezone`, `state`, `settings`, `updated_at` keep DB defaults and are written by our own API, not by Better Auth. |
| `member` | `memberships` | `organization_id`, `user_id`, `role`, `created_at`. Keep `UNIQUE(organization_id, user_id)` and `UNIQUE(organization_id, id)`; keep `CHECK(role IN ('owner','admin','recruiter','viewer'))`, which also forbids Better Auth's comma-separated multi-role values. `state` reduced to `active`/`suspended` (pending invites live in `organization_invitations`). Add `updated_at`. |
| `invitation` | `organization_invitations` | `organization_id`, `email`, `role`, `status`, `expires_at`, `inviter_id`, `created_at`. Add `UNIQUE(organization_id, id)`. |
| `passkey` | `auth_passkeys` | `name`, `public_key`, `user_id`, `credential_id`, `counter`, `device_type`, `backed_up`, `transports`, `aaguid`, `created_at` (source: `@better-auth/passkey` schema). |
| `twoFactor` | `auth_two_factors` | `secret` (encrypted by Better Auth), `backup_codes` (encrypted, see section 4), `user_id`, `verified`. |
| `rateLimit` | `auth_rate_limits` | `key`, `count`, `last_request`. |
| — | `auth_security_events` | Ours, unchanged; written from hooks. |

The SQL baseline comment in `01_identity_tenancy.sql` ("credential secrets … should reside at a hardened identity provider") no longer holds: password hashes, TOTP secrets and passkey public keys are in our Postgres. The DB-leak runbook (`03-caching-operations.md`) must add: rotate `BETTER_AUTH_SECRET`, revoke all sessions, force password reset.

### How domain tables reference identity

- Tenant-owned tables reference the organization with `organization_id uuid NOT NULL REFERENCES organizations(id)`.
- A reference to a *person acting inside the tenant* (owner of a vacancy, assignee of a task, author of a note) points to the **membership**, not the user: `FOREIGN KEY (organization_id, owner_membership_id) REFERENCES memberships(organization_id, id)`. The composite key makes a cross-tenant reference impossible, like the other composite tenant FKs.
- Domain tables never reference `users`, `sessions` or `auth_*` directly. `audit_events` store `actor_membership_id` (and `actor_user_id` only for platform events).
- Removing a member must not delete history: `memberships` rows referenced by domain data are suspended (`state = 'suspended'`), not deleted. Better Auth's `removeMember` deletes the row, so either (a) `beforeRemoveMember` throws and our `/v1` endpoint suspends instead, or (b) `ON DELETE RESTRICT` blocks the delete. Decision: (a), so Better Auth's member endpoints are not used for removal. `memberships.state` is declared through `schema.member.additionalFields` (supported; source: `dist/plugins/organization/organization.mjs`). Better Auth's own `checkMembership` ignores that column, which is why our per-request check reads it.

### Auth tables and RLS

Authentication runs before any tenant is chosen, and the organization plugin reads memberships across organizations (listing a user's organizations, `checkMembership`). Tenant RLS cannot apply to it.

- Two Postgres roles, two Hyperdrive configurations (Hyperdrive credentials are per configuration):
  - `ts_auth` (binding `HYPERDRIVE_AUTH`, caching disabled): used **only** by the Better Auth instance and the session/membership check middleware. DML on `users`, `sessions`, `auth_*`, `organizations`, `memberships`, `organization_invitations`. **No grants on any domain table.**
  - `ts_app` (binding `HYPERDRIVE`): domain access under tenant RLS. `SELECT` on `memberships` and `organizations` limited by RLS to the current organization; no access to `sessions` or `auth_*`.
- `memberships` stays in the RLS list of `07_rls_baseline.sql` for `ts_app`; add a permissive policy `TO ts_auth USING (true)` so the auth role can work across organizations. `users`, `sessions` and `auth_*` get RLS enabled with policies only for `ts_auth`, so `ts_app` reads nothing even if a grant is added by mistake.
- Both configurations run with caching disabled; tenant queries are never cached (ADR 0007, section 2).

## 6. Session and organization context lifecycle

### Sign-in to workspace (flows 01, 02, 03)

1. Sign-in by passkey, email and password (then TOTP if enabled), Google, Apple or Microsoft. Better Auth creates a `sessions` row and an HttpOnly cookie.
2. `databaseHooks.session.create.before` (`bindSingleOrganization`): if the user has exactly one active membership **and** that organization does not require explicit selection, set `active_organization_id`; otherwise leave it `NULL`. It also records `auth_method` (`passkey`, `password`, `password+totp`, `google`, …) for the policy checks in section 9. The sign-in method is derived from the request path in a `hooks.after` handler, the same way Better Auth's own `lastLoginMethod` plugin does it (`/callback/{provider}`, `/sign-in/email`, `/passkey/verify-authentication`; source: `dist/plugins/last-login-method/index.mjs`), and upgraded to `password+totp` after `/two-factor/verify-*`.
3. `GET /v1/me/organizations` lists active memberships (Kies je organisatie).
4. `POST /v1/organizations/{orgId}/switch` (our endpoint) runs policy checks (membership `active`, organization `active`, MFA and sign-in-method policy), calls `auth.api.setActiveOrganization` server-side, records a security event, and returns the new context including an `orgContextVersion`.
5. Better Auth sets the active organization itself in two cases: creating an organization (unless `keepCurrentActiveOrganization`) and accepting an invitation (source: `crud-org.mjs`, `crud-invites.mjs`). Both are explicit user actions, which is acceptable. The `/v1` switch endpoint is still the only general way to change it, because the raw `/organization/set-active` path is disabled.

### Per-request check (every `/v1` organization route)

```
cookie → sessions (HYPERDRIVE_AUTH, uncached) → not expired, not locked
       → users: email_verified = true, banned = false
       → memberships(active_organization_id, user_id): state = 'active'
       → organizations: state = 'active'
       → role permits the action (organization access control)
       → X-Organization-Id header == active_organization_id, else 409
       → open ts_app transaction, set app.current_organization_id, run handler
```

The `X-Organization-Id` comparison never grants access; it detects a stale tab that still believes it is in the previous organization after a switch, and fails closed instead of writing into the new one.

### Organization switch and cache clearing (flow 06)

Better Auth's `setActive` updates `active_organization_id` on the existing session row; it does not issue a new session token (source: `crud-org.mjs`, `adapter.setActiveOrganization` → `updateSession`). Because no organization context is held in a token or cookie cache (cookie cache off), the server-side context changes atomically with that row. On the client, the switch response triggers: abort in-flight requests, clear the query cache keyed by organization, reset in-memory stores, then reload the workspace. Open item: whether the product owner also wants the session token itself rotated on switch (a custom endpoint creating a new session and revoking the old one).

### Membership removal and role change (AUTH-03)

- Removal and suspension go through our `/v1` endpoint (section 5), which sets `memberships.state = 'suspended'` and clears `active_organization_id` on **all** sessions of that user for that organization. The per-request check above rejects the next request even without that update, because it reads the membership on every request from an uncached connection.
- Better Auth's own `removeMember` only clears the active organization on the *caller's* session when callers remove themselves, not on the removed user's sessions (source: `crud-members.mjs` line `if (session.user.id === toBeRemovedMember.userId …)`). That is why we do it ourselves.
- A role change takes effect on the next request (role read per request). Security event recorded via `afterUpdateMemberRole`.

### Sessions and devices

- Users see and revoke their own sessions with `listSessions`, `revokeSession`, `revokeOtherSessions` (https://www.better-auth.com/docs/concepts/session-management). Listing needs a fresh session.
- `revokeSessionsOnPasswordReset: true`. Ban (admin plugin) deletes all the user's sessions (source: `plugins/admin/routes.mjs`, `banUser` → `deleteUserSessions`).
- **No secondary storage (KV).** With `secondaryStorage`, sessions are stored there instead of the database by default (https://www.better-auth.com/docs/concepts/session-management), and Workers KV is eventually consistent with up to 60 s or more propagation (https://developers.cloudflare.com/kv/concepts/how-kv-works/). That breaks immediate revocation. Postgres stays the single source of truth; revisit only with a strongly consistent store (Durable Objects) and measured need.

### Idle lock (flow 05)

Better Auth has expiry (`expiresIn`) and sliding refresh (`updateAge`), not a per-organization idle timeout. We add:

- `organizations.settings.idleLockMinutes` (5–60, default 15).
- Client: activity tracker locks the UI after the threshold and clears organization caches.
- Server: `sessions.last_seen_at` updated by the per-request middleware at most once a minute; if `now - last_seen_at` exceeds the active organization's threshold, set `locked_at` and answer `423 Locked` on every `/v1` organization route. The browser timer alone is not the boundary.
- Unlock = re-authenticate with passkey, or password plus TOTP. This creates a new session; the locked one is revoked. Simple, and uses the library's own flows.

## 7. Revocation guarantees

| Event | Effect | Latency |
|---|---|---|
| Sign out / revoke session | Row deleted | next request |
| Membership suspended or removed | Membership read per request | next request |
| User banned | Sessions deleted, sign-in blocked | next request |
| Password reset | All sessions revoked | next request |
| Organization suspended | Organization read per request | next request |

These hold only with: cookie cache off, no secondary storage, and an uncached Hyperdrive configuration. Each is a regression test (cross-tenant BDD suite).

## 8. Admin plugin restrictions (D12)

The admin plugin adds platform-level user administration: list, get, create, update, remove users; set role and password; ban and unban; list and revoke a user's sessions; impersonation (https://www.better-auth.com/docs/plugins/admin). Default `admin` permissions include `impersonate` and `set-password`.

Our policy (D12): no routine operator access to tenant data; break-glass only, logged and approved. Impersonation would give an operator a full tenant session, and setting a password is account takeover. Configuration:

- Custom platform roles via `ac`/`roles`. Only one role, `platform-support`, with `user: ["ban"]` and `session: ["list", "revoke"]`. **No** `impersonate`, `impersonate-admins`, `set-password`, `set-email`, `create`, `update`, `delete`, `list`, `get`, `set-role`.
- `adminUserIds: []`; `platform_role` assigned only by migration-reviewed SQL, never through the API (`/admin/set-role` disabled).
- All other admin paths are in `disabledPaths`, so even a misconfigured role cannot reach them over HTTP.
- What remains: an operator can lock out a compromised or abusive account and kill its sessions. That needs no tenant data.
- Break-glass (account recovery, GDPR erasure of a user) runs as a reviewed script calling `auth.api.*` server-side, with a two-person approval and an `auth_security_events` record. Not built for the MVP.
- Organization owners and admins manage their own members with the organization plugin; that is tenant self-service, not operator access.

Why keep the plugin at all: ban with session revocation and the `banned` check at sign-in are useful and tested upstream. If even that is unwanted, drop the plugin and implement "disable user" as `DELETE FROM sessions` plus a `users` flag.

## 9. Organization policies

| Policy | Mechanism |
|---|---|
| Require MFA | Better Auth does not apply 2FA to social, passkey or magic-link sign-ins (https://www.better-auth.com/docs/plugins/2fa). Policy check at switch and per request: `sessions.auth_method` ∈ {`passkey`, `password+totp`, social+`totp`}. A passkey with user verification counts as MFA. Social-only users are asked to add a passkey or TOTP (step-up). Needs `twoFactor.allowPasswordless` so users without a password can enable TOTP. |
| Restrict sign-in methods | Same check: organization setting `allowedAuthMethods`; the switch endpoint rejects a session whose `auth_method` is not allowed and prompts re-authentication. |
| Idle lock 5–60 min | Section 6. |
| Step-up for export, key admin, billing, role escalation | `freshAge`-style check in our middleware against a `reauthenticated_at` session field; re-auth by passkey or TOTP. |
| Password expiry (D04) | Not built. Only if contractually required. |
| Breached passwords | Better Auth ships a `haveIBeenPwned` plugin (present in `better-auth/plugins` 1.7.12). It calls an external API: subprocessor and privacy review first. |

## 10. Social and enterprise sign-in

- **Google:** standard OIDC. Only provider in `accountLinking.trustedProviders`.
- **Apple:** client secret is a JWT signed with the `.p8` key, maximum six months validity, must be rotated; `https://appleid.apple.com` in `trustedOrigins`; no `localhost` or non-HTTPS return URLs; email only on first authorization: https://www.better-auth.com/docs/authentication/apple. Needs a deployed HTTPS host for testing.
- **Microsoft:** the `email` claim is tenant-mutable and not verified by Microsoft; Better Auth uses `oid` as account id: https://www.better-auth.com/docs/authentication/microsoft. Do not auto-link Microsoft accounts to existing users by email; treat the email as unverified until our own verification.
- **Enterprise SSO (SAML, per-organization OIDC):** `@better-auth/sso` supports OIDC and SAML with organization linking and domain verification (https://www.better-auth.com/docs/plugins/sso). It depends on `samlify` and XML libraries (`@better-auth/sso@1.7.12` dependencies) and edge support for SAML crypto is an open upstream request ([better-auth#10343](https://github.com/better-auth/better-auth/issues/10343)). Post-MVP, separate spike.

## 11. Cookies and origins

`workers.dev` is on the Public Suffix List, so `web.<account>.workers.dev` and `api.<account>.workers.dev` are different sites; `SameSite=Lax` cookies are not sent on cross-site `fetch`. Serve the SPA and `/v1/*` from **one origin** (web Worker with static assets, forwarding `/v1/*` to the API Worker via a service binding), which keeps `SameSite=Lax`, avoids third-party cookies and keeps passkey `rpID` simple. Locally, Vite already proxies to the Worker. Moving to a custom domain later changes `rpID`, which invalidates registered passkeys unless the new domain is chosen before beta (ties to D01/#9).

## 12. Email

Better Auth only calls our functions; it sends nothing itself. Required callbacks:

| Callback | Used for |
|---|---|
| `emailVerification.sendVerificationEmail` | AUTH-01 sign-up verification |
| `emailAndPassword.sendResetPassword` | password reset |
| `organization.sendInvitationEmail` | flow 06 invitations |
| `user.changeEmail.sendChangeEmailConfirmation` (plus `sendVerificationEmail` for the new address) | email change (when enabled; source: `dist/api/routes/update-user.mjs`) |
| `user.deleteUser.sendDeleteAccountVerification` | self-service account deletion (when enabled) |

Rules: do not await the send inside the request (timing side channel); use `waitUntil`, or better, an outbox row picked up by a Queue so a provider outage does not lose mail (https://www.better-auth.com/docs/authentication/email-password). Templates in Dutch via `@talentstroom/i18n`. Links contain tokens: never log them. Provider selection is a separate decision: EU processing, DPA, SPF/DKIM/DMARC on the final domain.

## 13. Versions (policy: older than 7 days)

As of 2026-10-29 (npm registry `time` field):

| Package | Latest | Published | Pin |
|---|---|---|---|
| `better-auth` | 1.7.14 | 2026-10-26 (too new) | **1.7.12** (2026-10-20) |
| `@better-auth/passkey` | 1.7.14 | 2026-10-26 (too new) | **1.7.12** (2026-10-20) |
| `auth` (CLI) | 1.7.14 | 2026-10-26 (too new) | **1.7.12** (2026-10-20) |
| `@better-auth/core`, `-kysely-adapter` | 1.7.14 | 2026-10-26 | 1.7.12 via `better-auth` |
| `pg` | 8.23.1 | 2026-09-30 | 8.23.1 |
| `kysely` (dependency, `^0.28.17 \|\| ^0.29.0`) | 0.29.7 | 2026-10-17 | resolved by pnpm |
| `@simplewebauthn/server` (passkey dependency `^13.3.1`) | 13.3.3 in range | 2026-08-26 | resolved by pnpm |

`organization`, `admin` and `twoFactor` ship inside `better-auth` (`better-auth/plugins`); `passkey` is a separate package. 1.7.13 and 1.7.14 become installable on 2026-11-01 and 2026-11-02. Better Auth releases several patch versions a week, so the 7-day rule will usually pin one or two patches behind.
