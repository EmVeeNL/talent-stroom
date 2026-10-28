# Client sharing

Expiring token digests, encrypted approved snapshots, strictly scoped document access, and advisory client feedback. Public guest endpoints must not use tenant-context RLS alone.

## Source schema

`../sql/04_client_sharing.sql`

## Implementation notes

- Every tenant-owned row has `organization_id`; enforce tenant identity at the API and database layers.
- Use migration-owned DDL; keep application database credentials least privileged.
- Add idempotency, deletion, and concurrency tests for each write workflow.
- Confirm indexes with `EXPLAIN (ANALYZE, BUFFERS)` on representative data.
- All free-text fields need data classification; extend encryption coverage before production.
