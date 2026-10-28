# Data protection

Use a random DEK per encrypted sensitive record. Wrap with an external KMS KEK; AEAD authenticated encryption; store ciphertext/nonce/wrapped key in Neon. Keep encryption, blind-index secrets, and plaintext out of logs. Files in private object storage.

## Source schema

`../sql/03_data_protection.sql`

## Implementation notes

- Every tenant-owned row has `organization_id`; enforce tenant identity at the API and database layers.
- Use migration-owned DDL; keep application database credentials least privileged.
- Add idempotency, deletion, and concurrency tests for each write workflow.
- Confirm indexes with `EXPLAIN (ANALYZE, BUFFERS)` on representative data.
- All free-text fields need data classification; extend encryption coverage before production.
