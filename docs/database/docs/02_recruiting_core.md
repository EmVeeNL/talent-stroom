# Recruitment core

An application is the candidate↔vacancy join and owns stage state. Composite foreign keys prevent cross-organization joins. Store sensitive candidate details in candidate_private.

## Source schema

`../sql/02_recruiting_core.sql`

## Implementation notes

- Every tenant-owned row has `organization_id`; enforce tenant identity at the API and database layers.
- Use migration-owned DDL; keep application database credentials least privileged.
- Add idempotency, deletion, and concurrency tests for each write workflow.
- Confirm indexes with `EXPLAIN (ANALYZE, BUFFERS)` on representative data.
- All free-text fields need data classification; extend encryption coverage before production.
