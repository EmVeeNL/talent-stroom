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
