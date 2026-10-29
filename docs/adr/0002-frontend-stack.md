# 0002 — Frontend stack: Vite + React app, Astro public site

- **Status:** Accepted
- **Date:** 2026-10-28
- **Resolves:** D13 — Frontend
- **Issue:** #22

## Context

Two surfaces with different needs: an authenticated, highly interactive recruiter app (pipelines, kanban, forms), and a static, SEO-focused, bilingual public website with tutorials. The desktop shell (v2, Tauri) should reuse the app UI.

## Options considered

1. **One framework for both (e.g. a full-stack meta-framework)** — single toolchain, but couples marketing deploys to the app and adds server rendering we don't need for an authenticated SPA.
2. **Vite + React SPA for the app, Astro for the site** — best fit per surface, both static-deployable to Cloudflare.

## Decision

- `apps/web`: Vite + React SPA. Talks to the API only through the documented `/v1` contract.
- `apps/site`: Astro, static-first, Dutch default (`/nl/`) with English (`/en/`).
- Shared code via workspace packages: `@talentstroom/ui` (design tokens, later components) and `@talentstroom/i18n` (catalogs).

## Consequences

- The app has no server-side rendering; sensitive data never touches an edge HTML cache.
- The desktop shell can load the same React UI.
- Two build pipelines to maintain, mitigated by Turborepo and shared packages.

## Rollback

The SPA and site are independent; either can be replaced without touching the API.
