# 0006 — Identity and organizations with Better Auth

- **Status:** Accepted
- **Date:** 2026-10-29
- **Resolves:** D03 — Auth provider
- **Issue:** #19 (also input for #52)

Detailed design, configuration sketch, schema mapping and sources: [`../architecture/architecture/04-identity-better-auth.md`](../architecture/architecture/04-identity-better-auth.md).

## Context

TalentStroom needs sign-up with email verification, multiple organization memberships per person with an explicitly chosen active organization, invitations, roles and immediate revocation (AUTH-01..03), plus passkeys, TOTP, Google/Apple/Microsoft sign-in, session and device management, and organization policies (require MFA, allowed methods, idle lock 5–60 min). Identity flows 01–06 describe the behaviour. Constraints: Cloudflare Workers + Hono, Neon Postgres via Hyperdrive, EU data location, forward-only SQL migrations, no routine operator access to tenant data (D12), and dependencies older than 7 days (ADR 0005).

The product owner chose Better Auth (self-hosted library, data in our Postgres). This ADR records that choice, the configuration and the risks found while verifying it against version 1.7.12.

## Options considered

1. **Managed IdP** — less code to own and hardened credential storage, but per-seat cost, a third party in the login path and processor for all identities, and organization membership semantics that must be mirrored into our database anyway.
2. **Better Auth on Workers** — open source TypeScript library running inside our API Worker; data in our EU Postgres; organization, admin, two-factor and passkey plugins cover most requirements. We own operations and security of credential storage, and the library moves fast.
3. **Hand-written auth (Lucia-style)** — full control, but we would write and maintain WebAuthn, TOTP, OAuth and invitation code ourselves.

## Decision

Use **Better Auth 1.7.12** (`better-auth`, `@better-auth/passkey`, CLI `auth`, all published 2026-10-20) inside `apps/api`, with:

| Plugin / feature                         | Use                                                                                                                                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `emailAndPassword` + `emailVerification` | `requireEmailVerification: true`, min length 12, `revokeSessionsOnPasswordReset: true`; default scrypt hashing via native `node:crypto`                                                             |
| `socialProviders`                        | Google, Apple, Microsoft (`tenantId: "common"`); only Google is a trusted provider for account linking                                                                                              |
| `organization`                           | Organizations, memberships, invitations (7-day expiry, email verification required to accept), roles `owner`/`admin`/`recruiter`/`viewer` via access control, `activeOrganizationId` on the session |
| `passkey`                                | WebAuthn (SimpleWebAuthn); registration requires a fresh session                                                                                                                                    |
| `twoFactor`                              | TOTP + 10 backup codes, `storeBackupCodes: "encrypted"`                                                                                                                                             |
| `admin`                                  | Only ban and session revocation for a `platform-support` role; impersonation, set-password and user CRUD disabled (D12)                                                                             |
| Rate limiting                            | Better Auth limiter with `database` storage, plus a Cloudflare WAF rule on `/v1/auth/*`                                                                                                             |

Runtime and data rules:

1. **Workers Paid plan** (password hashing exceeds the Free plan's 10 ms CPU limit).
2. Better Auth instance and `pg` pool **per request**; `AsyncLocalStorage` pre-seeded at module scope (workaround for upstream issue better-auth#10315); runtime schema check off in the Worker and run in CI instead.
3. Built-in **Kysely adapter + `pg`** through a dedicated Hyperdrive binding `HYPERDRIVE_AUTH` with **query caching disabled**, connecting as a Postgres role `ts_auth` that has no grants on domain tables. **This amends [ADR 0007](0007-database-neon-hyperdrive.md)**, which proposed one binding and access to the `auth` schema by `ts_app`: we use two uncached Hyperdrive configurations, `HYPERDRIVE` (`ts_app`, tenant data) and `HYPERDRIVE_AUTH` (`ts_auth`, auth schema). `ts_app` gets no grants on credential tables (password hashes, TOTP secrets, passkeys); the request middleware resolves session and membership through the auth connection.
4. **Sessions only in Postgres**: cookie cache off, no KV secondary storage. Every `/v1` organization request reads session, user, membership and organization state, so revocation is effective on the next request.
5. Tables follow our naming (`users`, `sessions`, `memberships`, `organizations`, `organization_invitations`, `auth_*`) with `uuid` ids; `auth_identities` is replaced by `auth_accounts`. Domain tables reference people through `(organization_id, membership_id) → memberships(organization_id, id)`, never `users`.
6. Better Auth's generated SQL is reviewed and committed as a normal forward-only migration; `auth migrate` is never run against shared environments.
7. Raw `/organization/set-active` and most `/admin/*` paths are blocked with `disabledPaths`; organization switching, member removal (suspend, not delete) and policy checks go through our own `/v1` endpoints, which call `auth.api.*` server-side.
8. SPA and API are served from **one origin** (`workers.dev` is a public suffix, so separate subdomains would be cross-site).

### Requirement mapping

| Requirement / flow | How it is met                                                                                                   | Built by us                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-01, flow 01   | Email verification required; organization creation only for verified users; creator becomes `owner`             | `/v1` middleware rejects unverified users; settings + audit on organization creation                                                                  |
| AUTH-02, flow 02   | `activeOrganizationId` on the session; auto-bind only with exactly one membership and no explicit-choice policy | Organization picker, `POST /v1/organizations/{orgId}/switch`, per-request membership check, `X-Organization-Id` mismatch → 409                        |
| AUTH-03, flow 06   | Invitations with expiry, recipient email match and verified email; roles via access control                     | Seat check in `beforeCreateInvitation`; suspend instead of delete; clear active organization on all the user's sessions; client cache purge on switch |
| Flow 03            | Google, Apple, Microsoft with state/PKCE handled by Better Auth                                                 | Microsoft email treated as unverified; enterprise SSO deferred                                                                                        |
| Flow 04            | Passkey registration behind fresh session; TOTP + backup codes                                                  | Notification and security event on enrolment                                                                                                          |
| Flow 05            | Session expiry and sliding refresh                                                                              | Per-organization idle lock (`last_seen_at`, `locked_at`, 423), unlock by re-authentication                                                            |
| Policies           | — (Better Auth does not enforce 2FA on social or passkey sign-in)                                               | `auth_method` on the session; require-MFA and allowed-method checks at switch and per request                                                         |

## Consequences

- **Easier:** passkeys, TOTP, OAuth, invitations and session management come from a maintained library; identity data stays in our EU Postgres with no per-seat fee and no extra processor.
- **Harder:** we now store password hashes, encrypted TOTP secrets and OAuth tokens. The DB-leak runbook must add secret rotation, session revocation and forced password reset. `BETTER_AUTH_SECRET` is a high-value secret (Workers secret, rotation procedure needed).
- **Security:** immediate revocation depends on three settings (no cookie cache, no secondary storage, uncached Hyperdrive) that must be guarded by regression tests. Admin plugin is reduced to ban and revoke; break-glass is a reviewed, two-person script, not an endpoint.
- **Cost:** Workers Paid is required. Every authenticated request does a few indexed lookups on an uncached connection.
- **Upgrades:** Better Auth ships several patches a week; with the 7-day rule we run one or two patches behind. Each upgrade regenerates the schema in CI and fails on drift.

### Risks

1. **Workers hangs (upstream, open).** Aborted requests can wedge cached init promises (better-auth#10315, #11651). Mitigated by the module-scope seed, a per-request instance and `validateSchema: false`; the fix PR #11482 is not merged. Verify with an abort test in the spike.
2. **Password hashing CPU and memory.** scrypt uses 32 MiB per hash and about 62 ms CPU on a laptop; not yet measured in workerd under concurrency against the 128 MB isolate limit.
3. **Stale reads via Hyperdrive.** A cached auth query would delay revocation by up to 75 s; auth must never use a cached configuration. Tenant queries are uncached as well (ADR 0007, section 2).
4. **Library defaults that are weaker than our policy:** backup codes stored in plaintext, sessions kept after password reset, 2FA not applied to social/passkey sign-in, OAuth tokens unencrypted, admin role with impersonation. All overridden in our configuration; each needs a test.
5. **Membership removal semantics.** Better Auth deletes the membership row and only clears the active organization for self-removal; we replace this with suspension.
6. **Passkey `rpID` tied to the domain.** Moving from `workers.dev` to the final domain invalidates registered passkeys (D01/#9).
7. **Supply chain.** Large dependency surface (`better-auth` pulls Kysely, jose, noble, SimpleWebAuthn); pinned via catalog and ADR 0005.

## Open items

1. Spike: deploy a minimal Worker with Better Auth 1.7.12 + Hyperdrive (caching off); measure sign-in CPU and memory, per-request instance cost, abort-hang workaround.
2. Decide whether an organization switch must also rotate the session token (custom endpoint), or whether server-side context change plus client cache purge is enough.
3. Choose the email provider (EU processing, DPA) and the outbox/queue path for auth mail.
4. Confirm `accountLinking` behaviour per provider (Google only trusted; Microsoft and Apple never auto-linked by email).
5. Define the require-MFA policy precisely (does Google sign-in plus TOTP count; do passkeys without user verification count).
6. Break-glass procedure for account recovery and user erasure (D12), including two-person approval.
7. Enterprise SSO (SAML/OIDC per organization) and SCIM: post-MVP spike; `@better-auth/sso` depends on `samlify`, edge support unverified.
8. Breached-password check (`haveIBeenPwned` plugin) after privacy review of the external call.
9. Rotation procedure for `BETTER_AUTH_SECRET` and the Apple client secret JWT (maximum six months).
10. Update `02-data-multitenancy.md` and `01_identity_tenancy.sql` naming per the mapping (#52).

## Rollback

Better Auth data lives in our own tables, so leaving it means replacing the library, not migrating out of a vendor. Users, organizations, memberships and invitations are plain rows and can be kept by any replacement. Password hashes are scrypt in a documented format (portable with a custom verifier); passkey public keys and TOTP secrets are portable if the replacement accepts them (TOTP secrets are encrypted with `BETTER_AUTH_SECRET`). Sessions would be revoked. Estimated cost: a few weeks for a replacement IdP integration plus a forced re-login, and possibly passkey re-enrolment.
