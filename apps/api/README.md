# TalentStroom API

## Security headers

`createApp()` registers the API security middleware before routes and validation.
Hono's `secureHeaders` supplies a deny-all CSP (`default-src 'none'; frame-ancestors
'none'; base-uri 'none'`), `nosniff`, `no-referrer`, same-origin COOP/CORP,
a Permissions-Policy denying powerful browser features, and two-year HSTS with
`includeSubDomains`. HSTS deliberately omits `preload` until the final domain is
chosen. Application `Server` and `X-Powered-By` banners are removed; headers added
by the hosting platform after the Worker returns require deployment verification.
This CSP is for API responses; the SPA HTML needs its own policy.

Every response defaults to `Cache-Control: no-store`, including `/health` and
problem responses. A route serving only public, non-sensitive metadata can opt in
explicitly, for example `c.header("Cache-Control", "public, max-age=60")`.
Errors always use `no-store`. Never opt tenant, candidate, shortlist, or
authenticated record responses into browser or shared edge caching.

The SPA and API share one origin (ADR 0006); no CORS middleware is enabled.
Cross-origin requests and preflights receive no `Access-Control-Allow-*` headers.
This is a browser access policy, not authorization or CSRF protection.
For the phase 10 developer API, add route-scoped Hono CORS middleware with an
explicit list of trusted origins, methods and request headers; reject unknown
origins, vary origin-dependent responses by `Origin`, and test allowed and denied
preflights. Do not reflect arbitrary origins or use a wildcard with credentials.
Review CORP for those routes alongside that change. Development should proxy API
requests through the SPA origin rather than enabling broad CORS.

Hono's `bodyLimit` caps request bodies at 1 MiB (1,048,576 bytes), returning a
correlated `application/problem+json` 413 (`payload-too-large`) on overflow.
It checks Content-Length when supplied and counts bytes when it is absent;
HTTP framing is enforced by the Workers runtime. Future upload endpoints need
their own reviewed limits before bypassing this default.

## Rate limiting

Two [Workers Rate Limiting bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
are declared in `wrangler.jsonc` (`ratelimits`). The binding only supports
periods of 10 or 60 seconds, and `namespace_id` must be a unique integer string
per Cloudflare account.

| Binding                   | Limit               | Key                           | Applied                                                                                                             | On binding error                                       |
| ------------------------- | ------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `RATE_LIMIT_ANON`         | 120 requests / 60 s | SHA-256 of `CF-Connecting-IP` | Globally in `createApp()`, after security headers; `GET /health` is exempt                                          | Fail open (request allowed, structured `console.warn`) |
| `RATE_LIMIT_AUTH_ATTEMPT` | 10 requests / 60 s  | SHA-256 of `CF-Connecting-IP` | Not applied yet; `authAttemptLimit` in `src/rate-limit.ts` is for future sign-in, sign-up and password-reset routes | Fail closed (429)                                      |

Raw IPs never appear in keys or logs. The hash is a pseudonym, not anonymisation: an unsalted SHA-256 of an IPv4 address can be reversed by brute force, so treat keys as personal data and never log them. the key is `<BINDING>:<sha256 hex>`, or
`<BINDING>:no-ip` when the header is missing (local dev, tests). Warnings log
only the binding name, policy and request ID. Exceeding a limit returns a
`429` `application/problem+json` (`too-many-requests`) with `Retry-After: 60`
(the binding does not report remaining time, so the window length is used).

Fail open for the global limiter keeps the API available if the limiter has an
outage; fail closed for auth attempts avoids opening a brute-force window.

Limits are per Cloudflare location and approximate (counts sync in the
background), so this is abuse damping, not a security boundary on its own.
Shared IPs (offices, mobile carriers) share a budget. Zone-level WAF rate
limiting rules will be added once a custom domain exists (#9); workers.dev has
no zone. Under `wrangler dev` the binding is simulated locally.
