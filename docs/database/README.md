# TalentStroom — Neon PostgreSQL database model

> **Reference only:** `docs/database/sql/*.sql` are the original design baseline. The real schema is built by `packages/database` migrations. The naming differences below follow the [Better Auth identity mapping](../architecture/architecture/04-identity-better-auth.md#5-schema-reconciliation-52).
>
> | Baseline name | Decided name | Schema |
> |---|---|---|
> | `users` | `users` | `auth` (Better Auth) |
> | `auth_identities` | `auth_accounts` | `auth` |
> | — | `sessions`, `auth_verifications`, `auth_passkeys`, `auth_two_factors`, `auth_rate_limits` | `auth` |
> | `organizations` | `organizations` | `app` (Better Auth model via `modelName: "app.organizations"`, [ADR 0012](../adr/0012-identity-schema-placement.md)) |
> | `memberships` | `memberships` | `app` (Better Auth model, ADR 0012) |
> | — (spec: `organization_invitations`) | `organization_invitations` | `app` (Better Auth model, ADR 0012) |
> | `auth_security_events` | `auth_security_events` | `auth` (ours, append-only, ADR 0012) |
> | `module_revisions` (spec) | `module_versions` (SQL baseline) | to be decided in #55 |

**Format:** executable PostgreSQL SQL (canonical), plus Markdown explanations. This is a strong **architecture baseline**, not a finished audited production deployment. SQL migrations must be reviewed and exercised in a disposable Neon branch before use.

## Directory

- `sql/00_foundation.sql` — extensions and tenant-context helper
- `sql/01_identity_tenancy.sql` — organizations, users, memberships, identity references
- `sql/02_recruiting_core.sql` — clients, vacancies, candidates, applications, placements
- `sql/03_data_protection.sql` — encryption envelopes, private payloads, blind indexes, documents, retention
- `sql/04_client_sharing.sql` — shortlists, scoped public links, feedback
- `sql/05_custom_modules.sql` — versioned admin-created modules and their values
- `sql/06_operations_ai.sql` — tasks, AI, translation, outbox, audit
- `sql/07_rls_baseline.sql` — template tenant policies (review carefully)
- `docs/` — a Markdown file for each of the six domains

## Migration order

Apply all numbered scripts in lexical order through your migration runner. Each is individually transactional. Prefer a *direct* Neon connection for migrations and pooled/serverless connections for Cloudflare Workers requests.

## Security model and non-negotiable limitations

1. **Do not store master keys, blind-index HMAC keys or unwrapped DEKs in Neon.** Use external KMS and authenticated encryption in trusted application services.
2. **A database dump is not sufficient to decrypt ciphertext** under this design. An attacker with application runtime privileges and KMS access might still decrypt; apply strict KMS access controls, auditing, rate limiting, and service separation.
3. **RLS alone is not authentication.** `app.organization_id` is trusted only when set by a server after membership verification, using `SET LOCAL` within a transaction. A direct SQL principal who can set custom configuration cannot be considered untrusted.
4. **RLS is defense in depth.** The runtime DB role must not own the tables, use `BYPASSRLS`, or use elevated migration credentials. Design separate bootstrap and portal authorization paths.
5. **Do not put PII in plaintext fields.** Some illustrative fields (`client_contacts.email`, reviewer name, etc.) are intentionally identifiable for modeling: classify and encrypt or otherwise protect them before production. The database design does not yet encrypt *all* personal data.
6. **No direct unauthenticated DB access.** Share grants verified in a dedicated API; return approved records only.
7. **Neon branches are not encryption boundaries.** Protect branch access, snapshots, replicas, logs, support access, and backups.

## Important remaining engineering work

- Replace basic RLS sample with reviewed per-role policies and transaction-scoped membership-verified context.
- Implement encryption in a dedicated application library; enforce exact nonce lengths, unique nonces, associated data (organization/record/type/version), KMS wrap/unwrap, and key rotation.
- Add database triggers or transactional checks for `shortlist_items.application_id` matching shortlist vacancy; custom-module `field_id` version matching its record; tenant-validation of polymorphic references.
- Add rigorous GDPR erase/export orchestration covering ciphertext, keys, files, indexes, translations, backups, and third parties.
- Extend encrypted storage for client-contact PII, candidate-shared snapshots, reviewer names, task content, and sensitive module fields.
- Define data access policies for shared/internal records, admin roles, and organizational reassignment.
- Add full migration tests, negative cross-tenant tests, concurrency tests, and disaster recovery drills.

## Suggested Cloudflare Workers integration

Use Hono + TypeScript, Drizzle or a well-maintained SQL driver compatible with Neon HTTP/WebSocket connections. Keep DB/transaction usage appropriate to transport limitations. For transaction-scoped `SET LOCAL` RLS, use a connection/transaction mode that actually guarantees session context for every statement; avoid assuming stateless HTTP calls share session variables. Validate this experimentally before deploying.

## Production status

**DESIGN BASELINE — security review and migration verification required.**
