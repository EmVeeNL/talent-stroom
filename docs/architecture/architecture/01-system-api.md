# 07 — API-first system architecture

## Chosen baseline
- **API:** Hono + TypeScript 7, deployed on Cloudflare Workers; OpenAPI-first contract generated/validated via schemas (e.g. Zod + OpenAPI integration), with reviewable `openapi.yaml`.
- **App:** Vite + React SPA, TypeScript 7; client communicates only through documented API.
- **Public site:** Astro, static-first, localized Dutch/English, served through Cloudflare.
- **Database:** managed EU PostgreSQL, accessed from Workers using a vetted Workers-compatible driver via Cloudflare Hyperdrive or appropriate provider connectivity; benchmark connections, regions, SSL and pooling.
- **Durable async:** Cloudflare Queues or Workflows for CV parsing, automation, deletion and notification jobs.
- **Files:** private R2 or compatible storage; application-layer encryption before storing sensitive CV blobs.
- **Keys:** external managed KMS/HSM separate from PostgreSQL (verify Cloudflare Workers KMS connectivity, residency and latency).
- **Cache:** Cloudflare Cache/KV for public/non-sensitive artifacts; ephemeral bounded server/client caching for authorized user data only.

## Modular monolith
Modules: `identity`, `organizations`, `clients`, `candidates`, `vacancies`, `applications`, `shortlists`, `tasks`, `placements`, `custom-modules`, `ai`, `billing`, `privacy`, `audit`. Each module owns business logic and schema/migrations; no feature reads other feature tables without an explicit service/domain boundary.

## Contract rules
`/v1` path; OpenAPI 3.1; JSON Schema/Zod single source of validation; typed generated client; RFC 9457-inspired problem responses; `Idempotency-Key` on creates/placements; cursor pagination; `ETag`/`If-Match` for conflicting updates; correlation/request IDs; `X-Organization-Id` may specify context but must never establish authorization alone.

## Sample endpoint catalog
`POST /v1/auth/org-selection`, `GET /v1/me/organizations`, `POST /v1/organizations/{orgId}/switch`, `GET|POST /v1/candidates`, `POST /v1/cv-uploads`, `GET /v1/parsing-jobs/{id}`, `GET|POST /v1/vacancies`, `POST /v1/applications`, `PATCH /v1/applications/{id}/stage`, `POST /v1/shortlists`, `POST /v1/shortlists/{id}/share-links`, `GET /public/v1/share/{token}`, `POST /public/v1/share/{token}/feedback`, `GET|POST /v1/modules`, `POST /v1/modules/{id}/publish`, `POST /v1/ai/translate`, `POST /v1/privacy/export-requests`.

## Public API policy
Internal product endpoints remain private by authorization, not obscurity. External developer API is read/write scope based and opt-in after hardening; OAuth2 or scoped expiring API credentials, per-org permissions, API request quotas, webhook signing and replay protection. Never expose generic plaintext bulk data endpoints by default.

## Worker constraints
Validate CPU limits, request body sizes, streaming support, KMS latency, crypto APIs, queue semantics, environment binding limits and regional placement in a pre-build proof of concept. Do not assume that Node-only crypto, ORM, or PDF extraction libraries work on Workers; heavy parsing can run in separately deployed EU worker services if necessary.
