# @talentstroom/web

Vite + React recruiter app. Run `pnpm --filter @talentstroom/web dev` for normal development.

## Visual review

From the repository root:

```sh
pnpm visual:install # install the matching Playwright Chromium browser once
pnpm visual         # capture the gallery
```

On Linux, `pnpm visual:install --with-deps` also installs Chromium's system dependencies.
Playwright owns the Vite server on **127.0.0.1:5185**, uses strict port binding, and stops it
when finished. No running API is needed; API requests are intercepted and blocked.

The harness imports `src/gallery/pages/index.ts` through Vite to discover all gallery pages
automatically. Each page gets full-page PNGs in light and dark at 1440×1000 and 390×844,
DPR 1, Dutch locale, Amsterdam timezone and a fixed clock. It waits for the selected panel,
`document.fonts.ready`, Asap Sharp and the rendered Material Symbols family. Missing font
faces fail capture. Animations are disabled during capture and reduced motion is enabled.

Open `artifacts/visual/index.html` for a contact sheet or review individual
`artifacts/visual/<page>-<theme>-<width>.png` files. Each run clears previous screenshots;
all artifacts are ignored by Git. These are review captures, with no pixel comparison or
baseline updates. Unit tests run via `pnpm --filter @talentstroom/web test`.

For manual inspection, the dev-only gallery accepts `/?gallery&theme=dark#forms` (or `light`).
The URL override ignores the saved theme, hides the persistent theme control, never writes
localStorage, and restores the previous root theme on unmount. Without a valid override,
the usual theme control works. Production builds exclude the gallery.

PRs touching `apps/web/**`, `packages/ui/**` or `packages/i18n/**` run the optional `visual`
CI job and upload the contact sheet and PNGs as a `visual` artifact for 14 days. Keep this
job out of required branch checks.

The visual harness captures the dashboard and a nested demo route through the
development-only `?preview=dashboard&theme=light|dark` path, which supplies synthetic
session context without a running API. The preview branch is removed from production
builds; it does not change the real auth guards. `?preview=guest` supplies the
guest transport for auth screenshots. Both modes keep context across Router link
navigation and block API requests from synthetic interactions. The same pathname
is matched, including 404 for unknown/disabled routes. Entry precedence remains
gallery, dashboard preview, enabled demo auth, then normal/guest-preview auth.
Production ignores both preview modes, including demo-enabled production builds.

The redesign kit in `docs/images/redesign/` is the review authority (tokens and component
specifications take priority over historical mockup pixels). Existing UI still uses
Material Symbols Outlined and older tokens; migrating to Rounded and the new kit is
separate work. The harness checks the actual icon font so it also supports Rounded once
that migration lands. DPR 2/3, 200% zoom, interaction states and accessibility audits remain
separate checks from this initial screenshot matrix.

# TalentStroom web app

Dutch-first React app with English available through the language selector and
light, dark and system themes through the shared ThemeToggle.

## Routes

| Route                    | Purpose                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `/inloggen`              | Email/password sign-in                                                     |
| `/registreren`           | Name, email, password and terms; then check your email                     |
| `/e-mail-bevestigen`     | Better Auth verification callback; resend verification                     |
| `/wachtwoord-vergeten`   | Request a password reset email                                             |
| `/wachtwoord-herstellen` | Set a new password using the emailed token                                 |
| `/organisatie-kiezen`    | List, confirm/switch or create an organization                             |
| `/`                      | Signed-in home in the app shell (sidebar, navbar, org switcher, user menu) |

TanStack Router 1.170.46 owns navigation, browser back/forward and replace
redirects. `src/router.tsx` builds an inferred, code-based tree with a root,
pathless auth and dashboard layouts, lazy pages, Skeleton pending UI and a
localized dashboard `notFoundComponent`. `src/routes.ts` retains the Dutch path,
title/access/demo inventory used by navigation. There is no file generator,
router plugin, Query cache or Router devtools in this migration.

`Link.tsx` is a thin Router link wrapper, with native anchors for downloads and
standalone gallery examples. Shared UI anchors use `NavigationLinkContext` so
sidebar, breadcrumb and organization-switcher links keep modified clicks,
targets, downloads and hashes. Sidebar active state reads Router state. The
production host must serve the SPA for all these paths.
Guests on protected routes go to `/inloggen`. Signed-in users without a verified
active organization go to `/organisatie-kiezen`. Sign-in and registration redirect
existing signed-in users to their workspace or picker. Verification and recovery
remain accessible. The root `beforeLoad` waits for the existing session and
membership bootstrap; the dashboard guard requires an active ID matching a
returned membership. Loading and session errors retain their recovery UI.
Redirects discard the intended target, as before: there is no return-URL or
open-redirect feature. These guards provide UX only; the API must verify every
organization-owned request's membership and organization scope.

The dev-only component gallery remains at `/?gallery`; it bypasses auth and is
excluded from production.

Demo navigation pages are enabled by default in development (`vite`).
Production builds hide demo routes unless `VITE_DEMO_PAGES=true` is set at build
time. With the flag off, only the Recruitment dashboard remains in the sidebar
and other demo URLs render the 404 placeholder. Demo screens must use synthetic
data only. See `apps/web/.env.example` for the opt-in setting.

## Try locally

Use Node 26 and pnpm 12. From the repository root:

1. `pnpm install`
2. `pnpm db:up && pnpm db:migrate && pnpm db:dev-passwords`
3. Copy `apps/api/.env.example` to `apps/api/.env`, set a random
   `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:5173` and
   `MAIL_TRANSPORT=mailpit` (see the API README for database setup).
4. `pnpm dev`
5. Open http://localhost:5173/registreren and register with synthetic data.
6. Open Mailpit at http://localhost:8025, follow the verification link, then sign in.
7. Create your first organization. Open the navbar organization switcher
   (“Switch organisatie”) and pick another organization; it switches immediately
   (session rotation, scoped state reloaded).
8. Sign out and use “Wachtwoord vergeten?” to exercise password recovery through
   Mailpit.

Vite proxies `/api/auth/*` unchanged to the API on port 8787 and strips `/api`
for our `/api/v1/*` calls. Production routing must preserve the same mapping.
Cookies are HttpOnly and same-origin; no token or tenant context goes into
localStorage. Callback tokens and callback errors are captured in component memory and removed
from the current address/history entry before Router initializes. They are never
passed into Router context, search state or loader caches. Ordinary search state
uses an allowlisted validator; no personal data or free-text filters belong in
route search parameters.

## Implementation and limits

Auth screens use a split layout at 1024px and above. The hero background is a CSS
placeholder with a navy gradient and the brand wave; `--auth-hero-image` is the
single replacement point for a licensed image when issue #383 is resolved. No
photograph is bundled. The email/password flow does not currently support a
remember-me session option, so the login screen omits that checkbox. Social
buttons are omitted because provider discovery is not configured by the API.

TanStack Router is pinned in the workspace catalog under ADR 0015. Better Auth calls use plain fetch;
organization operations use `@talentstroom/api-client`. The only retained server
data is the app's in-memory membership context. Switching/creating aborts outstanding
scope requests; success discards context and reloads the session and memberships
before opening the workspace. Future tenant caches must join this invalidation
boundary. There is no service-worker or persistent tenant cache.

Errors use translated safe messages; raw problem details, email addresses,
passwords and tokens are never logged or rendered in errors. HTML form constraints
check required fields, email format, password length (12–128), organization name
length (2–100) and terms acceptance. The API remains authoritative for access and
validation. Terms acceptance is currently a UI requirement; this task adds no
server-side consent record or legal-document route.

Social buttons are omitted because the API exposes no provider-discovery endpoint.
Passkey and MFA challenge screens are follow-ups beyond the requested email/password
flow; a two-factor redirect response never opens the workspace.

## Verification

`pnpm --filter @talentstroom/web test` runs Vitest component tests with mocked fetch
and jsdom, covering routes, forms, safe problem responses, verification/reset
callbacks, keyboard-accessible controls and organization creation/switching.
The login form also has an axe accessibility check. Native dialog focus containment,
screen-reader interoperability and rendered contrast still need manual verification.
Run `pnpm check` and `pnpm build` at the root before review.
