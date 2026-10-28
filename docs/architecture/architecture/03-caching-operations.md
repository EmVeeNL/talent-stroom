# 11 — Caching, database hosting, operations and recovery

## Hosting selection criteria
EU data locality and subcontracting terms; managed Postgres PITR, audited SOC2/ISO evidence, encrypted storage, network isolation, high availability, region failover, reliable Workers connectivity/Hyperdrive compatibility, latency, cost ceilings and operational support. Candidate providers should be compared with a proof of concept; do not assume all providers offer identical data location guarantees.

## Cache classes
- **Public marketing/docs assets:** Cloudflare CDN, hashed immutable assets, long TTL.
- **Public portal pages:** default `Cache-Control: no-store` for any candidate/shortlist response; no shared edge caching.
- **Authenticated records:** no CDN shared caching; client cache keyed by `identity+organization+resource+authorization-version`, encrypted only if persisted. Clear caches on org switch, logout, role change, lock or revocation.
- **Search:** avoid caching raw plaintext PII; optional short-lived per-session in-memory result cache with invalidation on writes.
- **Static metadata:** safe caches with versioned keys and TTL.
- **Revocation:** server checks authoritative link and membership status even if cache exists; use cache purge events for non-sensitive derived views.

## Reliability
DB PITR and encrypted daily backups; RPO target 15 min and RTO target 4h initially, verified by restore drills. KMS/key recovery must be tested alongside database restoration or recovered DB ciphertext may be unusable. Durable queue with idempotent handlers, DLQ, poison-message alarm. Processing jobs have bounded retries/backoff and defined retention. Health probes and synthetic login/API checks.

## Observability and cost
Measure per endpoint p50/p95/p99, Worker CPU/wall time, KMS decrypt rate/latency, database saturation, queue backlog, AI cost per task, blob upload errors, portal abuse, billing drift, build/deployment failures. Redact sensitive data from logs. Set budget alerts and rate controls per organization.

## Disaster runbooks
DB leak (rotate DB creds, suspend access, preserve evidence, determine ciphertext exposure); app compromise (rotate KMS permissions and sessions, disable decrypt); KMS outage (fail closed for plaintext access, retry), tenant misrouting (stop traffic and notify incident commander); cache leak (invalidate and investigate). Verify backup restorability quarterly during initial production.
