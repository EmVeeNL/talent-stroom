# 08 — Database design and multi-organization identity

## Membership model
A human has one global identity and belongs to zero or many organizations. Tables: `identities`, `organizations`, `organization_memberships(identity_id, organization_id, role, status)`, `organization_invitations`, `sessions`, `authenticators`, `security_events`. Keep identity email global but organization-owned profiles and business data tenant scoped. An invitation does not grant membership until accepted and verified.

## Login step two
1. Authenticate with approved IdP/passkey/password.
2. Server loads only active memberships. If multiple, show `Kies je organisatie`; optionally show for single membership based on security policy.
3. On select, mint/rotate session context bound to organization and membership version.
4. On context change, revoke old org-scoped caches, in-flight requests and token/session context; client displays clear active-org indicator.
5. Every request independently verifies user, active org, resource ownership, membership status and action privilege; never trust the selector/header on its own.

## Domain entities
`organizations`, `clients`, `client_contacts`, `vacancies`, `candidates`, `applications`, `application_stage_events`, `placements`, `tasks`, `documents`, `shortlists`, `shortlist_items`, `share_tokens`, `client_feedback`, `custom_module_*`, `audit_events`, `billing_subscriptions`, `privacy_requests`, `retention_policies`, `key_metadata`.

Every tenant-owned table has `organization_id` and appropriate compound constraints/FKs: `UNIQUE(organization_id, candidate_id, vacancy_id)` for applications; composite foreign keys `(organization_id, candidate_id)` etc prevent cross-org relationships. Sensitive fields are envelope-encrypted; non-sensitive operational columns remain queryable only after documented minimization review.

## Schema direction
Store candidate fields in encryption envelopes rather than directly readable PII columns. Example: `candidates(id UUID, organization_id UUID, encrypted_profile BYTEA, wrapped_dek BYTEA, key_version TEXT, profile_nonce BYTEA, profile_tag BYTEA, search_email_blind_index BYTEA NULL, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ)`. Exact ciphertext packaging depends on approved cryptographic library. Include immutable ID, tenant ID, record type, schema version in authenticated associated data.

## Relationships
Candidate ↔ vacancy is `application`, and stage lives on application, never candidate. Placements have unique application relationship. Shortlists store client-visible snapshots, not live views; documents require authorization on every download. External guests access only explicitly shared snapshot items, not tenant query endpoints.

## Search implications
Record-level encryption makes arbitrary plaintext SQL `LIKE`, full-text search and sorting on protected fields impossible. Define an approved **search capability matrix**: exact matching via HMAC blind indexes for email/phone (per tenant key, normalized input); possibly prefix/token-based blind indexes after leakage assessment; limited client-side filtered results on small authorized sets; or dedicated isolated encrypted-search design reviewed before launch. Blind indexes leak equality/frequency and require their own separately derived key and rotation plan. Never promise full-text skill search without explicit leakage, query quality and performance review.

## Migrations
Forward-only additive migrations first; backfills via idempotent durable jobs; compatibility rollout (expand → migrate → contract); backups and rollback plans. Version encryption envelope and schemas independently.
