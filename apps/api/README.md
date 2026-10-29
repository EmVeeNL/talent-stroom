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

| Binding                   | Limit               | Key                           | Applied                                                                                                                             | On binding error                                       |
| ------------------------- | ------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `RATE_LIMIT_ANON`         | 120 requests / 60 s | SHA-256 of `CF-Connecting-IP` | Globally in `createApp()`, after security headers; `GET /health` is exempt                                                          | Fail open (request allowed, structured `console.warn`) |
| `RATE_LIMIT_AUTH_ATTEMPT` | 10 requests / 60 s  | SHA-256 of `CF-Connecting-IP` | `POST /api/auth/sign-in/*`, `/sign-up/*`, `/request-password-reset`, `/reset-password`, `/two-factor/verify-*` (`authAttemptLimit`) | Fail closed (429)                                      |

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

## Authentication

Better Auth 1.7.12 runs inside this Worker ([ADR 0006](../../docs/adr/0006-identity-better-auth.md),
schema placement [ADR 0012](../../docs/adr/0012-identity-schema-placement.md)). Code: `src/auth/`,
mail: `src/mail/`.

### Path layout

The SPA and API share one origin (`BETTER_AUTH_URL`). Browser paths and Worker paths:

| Browser (app origin) | Worker        | Served by                                                        |
| -------------------- | ------------- | ---------------------------------------------------------------- |
| `/api/auth/*`        | `/api/auth/*` | Better Auth (`basePath`); prefix kept so links and cookies match |
| `/api/v1/*`          | `/v1/*`       | our OpenAPI routes (`openapi.json`)                              |
| `/api/health`        | `/health`     | health check                                                     |

Locally the Vite dev server does this mapping (`apps/web/vite.config.ts`: `/api/auth` is proxied
unchanged, every other `/api/*` has the prefix stripped). The production front door (web Worker
forwarding to the API Worker) must apply the same mapping.

Better Auth endpoints used now: `POST /api/auth/sign-up/email`, `GET /api/auth/verify-email`,
`POST /api/auth/sign-in/email`, `POST /api/auth/sign-out`, `GET /api/auth/get-session`,
`POST /api/auth/request-password-reset`, `POST /api/auth/reset-password`, `/api/auth/two-factor/*`,
invitation endpoints under `/api/auth/organization/*`. Not served over HTTP (404, `DISABLED_PATHS`
in `src/auth/create-auth.ts`): organization create/set-active/delete/leave/remove-member and every
admin path except `ban-user`, `unban-user` and `revoke-user-sessions` (`platform-support` role).

Our endpoints (`/v1`, cookie session, `application/problem+json` errors):

| Route                                   | Checks                                     | Result                                                        |
| --------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `GET /v1/me/organizations`              | session, verified email, not banned        | active memberships in active organizations, active org id     |
| `POST /v1/organizations`                | same + same-origin                         | 201, creator is `owner`, session rotated into the new org     |
| `POST /v1/organizations/{orgId}/switch` | same + active membership in `orgId`        | 200, old session deleted, new cookie bound to `orgId`         |
| `GET /v1/organizations/current`         | same + active membership in the active org | the verified context, read through `ts_app` with `withTenant` |

401 without a valid session; 403 for an unverified or banned user, a cross-origin unsafe request,
or no active membership; 409 when `X-Organization-Id` differs from the session's active
organization (the header never selects a tenant).

### Sessions and organization context

- Sessions live only in Postgres (`auth.sessions`, uncached `HYPERDRIVE_AUTH` as `ts_auth`): no
  cookie cache, no secondary storage. Every `/v1` request reads session, user, membership and
  organization state, so sign-out, suspension, ban and password reset apply on the next request.
- Organization-scoped routes use `requireMembership` (`src/auth/middleware.ts`), which puts a
  `TenantContext.fromVerifiedMembership(...)` on the context for `withTenant`.
- **Switching rotates the session token** (owner decision 1). After verifying the membership, the
  switch endpoint calls a server-only Better Auth endpoint (`src/auth/session-rotation.ts`) that
  deletes the current session row, creates a new one with `active_organization_id` set (copying
  `created_at` and `expires_at`, so a switch neither makes the session "fresh" nor extends it) and
  sets the new cookie. Creating an organization rotates the same way. Clients must abort in-flight
  requests and drop every cached response of the previous organization.

### Cookies

`ts.session_token` (signed with `BETTER_AUTH_SECRET`, `HttpOnly`, `SameSite=Lax`, `Path=/`). On
HTTPS origins it is `__Secure-ts.session_token` with `Secure`. Better Auth checks `Origin` on its own
state-changing routes; our `/v1` routes require `Origin` (or `Referer`) to equal `BETTER_AUTH_URL`
for unsafe methods.

### Mail

`MailTransport` (`src/mail/`) with `mailpit` (Mailpit HTTP API `POST /api/v1/send`, local only),
`log-only-for-tests` (keeps messages in memory, logs the template name only) and the `none` default,
which sends nothing and fails closed. The production provider follows in #232. Templates for
verification, password reset and invitation are Dutch, English when the request's first
`Accept-Language` is English (`mail.*` keys in `@talentstroom/i18n`). Recipients, bodies and links
(tokens) are never logged; sends run after the response (`waitUntil`).

### Configuration

| Name                                 | Where                                        | Purpose                                             |
| ------------------------------------ | -------------------------------------------- | --------------------------------------------------- |
| `HYPERDRIVE_AUTH`                    | `wrangler.jsonc` (placeholder id, see below) | Better Auth as `ts_auth`, caching **disabled**      |
| `BETTER_AUTH_SECRET`                 | Workers secret (`secrets.required`)          | signs cookies, encrypts TOTP secrets/backup codes   |
| `BETTER_AUTH_URL`                    | Workers secret (`secrets.required`)          | public app origin, e.g. `http://localhost:5173`     |
| `MAIL_TRANSPORT`                     | var `none`; `mailpit` in `apps/api/.env`     | mail transport                                      |
| `GOOGLE_*`, `MICROSOFT_*`, `APPLE_*` | optional secrets                             | social sign-in, enabled only when ID and secret set |

Before the first deploy the owner creates the uncached configuration
(`wrangler hyperdrive create talentstroom-auth --caching-disabled --connection-string=…` as
`ts_auth`), replaces the `00000000000000000000000000000000` id, and sets both secrets with
`wrangler secret put`. Social provider variables must also be added to `secrets.required`,
otherwise `wrangler dev` does not pass them to the Worker.

### Local setup

```sh
pnpm db:up && pnpm db:migrate && pnpm db:dev-passwords   # or pnpm db:reset for a fresh database
cp apps/api/.env.example apps/api/.env                   # set BETTER_AUTH_SECRET to a random value
pnpm dev                                                 # app http://localhost:5173, API :8787
```

Sign up through the app origin (`POST http://localhost:5173/api/auth/sign-up/email` with
`Origin: http://localhost:5173`), open the verification mail in Mailpit (http://localhost:8025),
follow the link, sign in, then `POST /api/v1/organizations`.

### Tests

- Unit (no database): `src/auth/auth.test.ts`, `src/mail/mail.test.ts`.
- Postgres (skipped without `DATABASE_TEST_URL`; scratch database per file, as `ts_auth` and
  `ts_app`): `src/auth/identity.integration.test.ts` (BDD scenarios of #61, #62, #67) and
  `src/auth/schema.integration.test.ts`, the Better Auth runtime schema check
  (`validateSchema: true`) that CI runs in the `database` job instead of `auth generate` (ADR 0012).

```sh
DATABASE_TEST_URL=postgres://postgres:postgres_local_dev_only@127.0.0.1:5432/talentstroom \
  pnpm --filter @talentstroom/api test
```

### Workers runtime notes

Per ADR 0006 (upstream better-auth#10315, #11651): the three `AsyncLocalStorage` instances are
seeded at module start-up (`src/auth/runtime.ts`), the Better Auth instance and its `pg` pool
(`max: 1`) are created per request and closed after the response, and `validateSchema` is off in
the Worker.
