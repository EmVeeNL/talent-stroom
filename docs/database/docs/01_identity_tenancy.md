# Identity and tenancy

> **Reference only:** `docs/database/sql/*.sql` are the original design baseline. The real schema is built by `packages/database` migrations. See the [Better Auth identity mapping](../../architecture/architecture/04-identity-better-auth.md#5-schema-reconciliation-52) for the decided names.

Users may belong to multiple organizations. Select an active organization after login, verify an active membership, then set organization context transaction-locally. OAuth/SSO/passkey/MFA state belongs primarily to a hardened identity provider.

## Source schema

`../sql/01_identity_tenancy.sql`

## Implementation notes

- Every tenant-owned row has `organization_id`; enforce tenant identity at the API and database layers.
- Use migration-owned DDL; keep application database credentials least privileged.
- Add idempotency, deletion, and concurrency tests for each write workflow.
- Confirm indexes with `EXPLAIN (ANALYZE, BUFFERS)` on representative data.
- All free-text fields need data classification; extend encryption coverage before production.
