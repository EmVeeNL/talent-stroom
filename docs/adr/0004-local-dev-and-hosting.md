# 0004 — Local development with Wrangler and hosting on workers.dev

- **Status:** Accepted
- **Date:** 2026-10-28
- **Issue:** #9 (domain), #37 (previews)

## Context

Trademark and domain clearance (#9) is not done. We still want shareable deployed environments, and fast local development without a Cloudflare account for every contributor.

## Decision

- **Local:** `wrangler dev` runs the API in the real Workers runtime (workerd, via Miniflare) on `http://localhost:8787`, with local simulations of bindings. `apps/web` runs on Vite (`:5173`) and proxies `/api/*` to the local Worker.
- **Deployed:** no custom domain for now. Workers are published on `*.workers.dev` (`workers_dev: true`).
- **Compatibility date:** set to the newest date supported by the pinned Wrangler/workerd (currently `2026-10-26`) and advanced when Wrangler is upgraded.
- Observability (Workers Logs and Traces) is enabled in `wrangler.jsonc`.

## Consequences

- No DNS or certificate work until the brand is cleared.
- `workers.dev` URLs are public; previews must use synthetic data only (CI/CD policy).
- Moving to a custom domain later means adding routes/custom domains and updating CORS and CSP origins.

## Rollback

Not applicable; adding a custom domain later is additive.
