# Operations and AI

Tasks, durable outbox, audit events, AI jobs, encrypted translated text, and human publication approval. AI input/output should not leak personal data into event payloads.

## Source schema

`../sql/06_operations_ai.sql`

## Implementation notes

- Every tenant-owned row has `organization_id`; enforce tenant identity at the API and database layers.
- Use migration-owned DDL; keep application database credentials least privileged.
- Add idempotency, deletion, and concurrency tests for each write workflow.
- Confirm indexes with `EXPLAIN (ANALYZE, BUFFERS)` on representative data.
- All free-text fields need data classification; extend encryption coverage before production.
