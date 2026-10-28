# Marketing 02 — Website, tutorials and developer portal

## Stack and information architecture
Astro static-first, TypeScript 7, Dutch default, English alternate, hosted on Cloudflare; shared tokens from UI package. Pages: `/nl/`, `/nl/hoe-het-werkt`, `/nl/functies`, `/nl/beveiliging`, `/nl/prijzen` (when validated), `/nl/voor-recruitmentbureaus`, `/nl/veelgestelde-vragen`, `/nl/beta`, `/nl/handleiding`, `/nl/contact`, `/nl/privacy`, `/nl/verwerkersovereenkomst` (approved legal copy), and `/developers` with API reference.

## How it works
Step 1 upload CV → human verification; Step 2 link to vacancy → pipeline; Step 3 create shortlist → client secure link; Step 4 capture feedback → plan follow-up; Step 5 confirm placement. Include authentic product screenshots using synthetic demo candidates, not real PII.

## Beta form
Capture work email, agency name, team size, specialization, current tool, biggest pain point, consent/communications preference as appropriate; anti-spam, rate limiting, retention/deletion policy, transparent privacy notice, confirmed acknowledgment. Explicitly separate beta operational communication from optional marketing consent.

## Tutorials
Five-minute setup; adding candidate with CV; making a vacancy; moving pipeline stage; sharing a shortlist and expiry; handling client feedback; creating niche module; configuring language, passkeys/MFA, inactivity lock and retention; exporting/deleting data.

## Developer docs
OpenAPI 3.1 spec hosted with Swagger UI/Scalar/Redoc as appropriate, version selector, auth/scopes, pagination, error codes, rate limits, idempotency, webhooks/signature verification, sandbox tokens and copy-paste TS SDK examples. Client-facing external API publishing gated until security audit and authorization design complete.

## Website quality
Responsive WCAG 2.2 AA, SEO metadata, canonical/hreflang, sitemap, structured data where justified, CSP, analytics without CV/PII, fast Core Web Vitals, cookie/consent review, image optimization, no speculative testimonials/logos, legal review of security promises. CI checks links, accessibility, translations, docs/OpenAPI drift and screenshot/demo freshness.

## Beta readiness
Screenshots from synthetic staging; clear product status and exclusions; monitored signup delivery; support mailbox/helpdesk; feedback form; tutorial videos with captions; privacy/terms and provider list approved.
