# Custom modules

Declarative module versions and fields, no arbitrary code. Sensitive custom fields are ciphertext. Database/service must ensure field and record are on same module version.

## Source schema

`../sql/05_custom_modules.sql`

## Implementation notes

- Every tenant-owned row has `organization_id`; enforce tenant identity at the API and database layers.
- Use migration-owned DDL; keep application database credentials least privileged.
- Add idempotency, deletion, and concurrency tests for each write workflow.
- Confirm indexes with `EXPLAIN (ANALYZE, BUFFERS)` on representative data.
- All free-text fields need data classification; extend encryption coverage before production.
