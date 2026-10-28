# Identity and tenancy

Users may belong to multiple organizations. Select an active organization after login, verify an active membership, then set organization context transaction-locally. OAuth/SSO/passkey/MFA state belongs primarily to a hardened identity provider.

## Source schema

`../sql/01_identity_tenancy.sql`

## Implementation notes

- Every tenant-owned row has `organization_id`; enforce tenant identity at the API and database layers.
- Use migration-owned DDL; keep application database credentials least privileged.
- Add idempotency, deletion, and concurrency tests for each write workflow.
- Confirm indexes with `EXPLAIN (ANALYZE, BUFFERS)` on representative data.
- All free-text fields need data classification; extend encryption coverage before production.
