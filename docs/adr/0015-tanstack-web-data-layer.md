# 0015 — TanStack web data layer

- **Status:** Accepted (owner, 2026-10-30; Charts decision amended by the owner)
- **Date:** 2026-10-30
- **Resolves:** —
- **Issue:** #422 (epic #421; implementation #423–#427)

## Context

The web app uses React 19.3.1, Vite 8.3.5, TypeScript 7.0.2 (the native compiler, tsgo), openapi-fetch 0.17.0 and Zod 4.6.7. ADR 0005 requires exact catalog pins and a minimum release age of seven days, including transitive dependencies. ADR 0013 keeps our plain CSS, tokens and accessible UI components. The owner wants TanStack Router, Query, Table, Form and a chart decision before future recruitment features build on the demo pages.

Today `App.tsx` owns session loading, organization selection, History API navigation and lazy page rendering. `routes.ts` has typed metadata (`path`, `layout`, `access`, `demo`, title and loader); `navigation.ts`, `navigate.ts` and `Link.tsx` consume it. Its `path: string` does not yet give literal route inference. `auth.ts` aborts requests and maps HTTP statuses to translation keys. `@talentstroom/api-client` exposes an openapi-fetch client with same-origin credentials and generated response types; `@talentstroom/contracts` exposes Zod contracts through its public entry point.

`DataTable` owns sorting and controlled selection. Charts are flat files, not a `charts/` directory: `BarChart.tsx`, `LineChart.tsx` (also area), `DonutChart.tsx`, `ChartLegend.tsx` and the shared `chart.tsx`. They already have token colours, non-colour distinctions, keyboard/focus tooltips, localized numbers and expandable data tables.

PRs [#416](https://github.com/EmVeeNL/talent-stroom/pull/416)–[#420](https://github.com/EmVeeNL/talent-stroom/pull/420) merge before migration. They add dashboard compositions, Deals/Leads/payroll/attendance, six demo apps, split auth pages and guest preview, and profile/contact/error pages. They continue to use the route table; #419 adds demo auth routes and #420 changes the error-page import. Migration must inventory the **merged** table and navigation, not recreate today's placeholders. Contact/profile/validation demos remain synthetic and local.

This spike changes documentation only. **AGENTS.md rule 1 requires this ADR to be accepted before authentication or tenant-scoping implementation**, including Router guards, Query session/organization handling and auth forms. No acceptance is implied by the spike. Guards provide UX; **every organization-owned API read/write must verify membership and organization scope server-side** (rule 2). A header, route context or query key never grants access.

## Options considered

1. Keep the current small implementations. No new dependencies, but routing, cache lifecycles, forms and table state would evolve independently.
2. Adopt Router, Query, Table and Form behind our existing UI and API contracts; retain SVG charts. Code-based routing minimizes migration changes; file-based routing adds generated routes and automatic splitting.
3. Adopt all five immediately, including TanStack Charts. A consistent vendor family, but chart replacement costs JavaScript and accessibility/theming work without a current feature requirement. Another chart vendor adds the same migration work without an identified advantage.

### Release and compatibility research

Checked **2026-10-30** against the npm registry and official documentation. Dates below are npm publication dates in UTC, not GitHub release-page timestamps. The conservative eligibility cutoff is **2026-10-23 00:00 UTC**; none of the selected pins is near that boundary. “Latest” means the stable `latest` dist-tag, not an alpha tag. All packages in this table declare **MIT**; release age alone does not establish security or API maturity.

| Package                          | Latest stable / published          | Eligible pin / published  | React peer / decision                                                      |
| -------------------------------- | ---------------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| `@tanstack/react-router`         | 1.170.46 / 2026-10-22              | **1.170.46** / 2026-10-22 | `>=18.0.0 \|\| >=19.0.0` (React DOM likewise); adopt                       |
| `@tanstack/router-plugin`        | 1.168.48 / 2026-10-22              | 1.168.48 / 2026-10-22     | Router `^1.170.46`, Vite >=5 including 8; measured alternative, do not add |
| `@tanstack/react-query`          | 5.105.0 / 2026-10-26 (**blocked**) | **5.104.5** / 2026-10-19  | React and React types `^18 \|\| ^19`; adopt                                |
| `@tanstack/react-query-devtools` | 5.105.0 / 2026-10-26 (**blocked**) | **5.104.5** / 2026-10-19  | React/types `^18 \|\| ^19`, Query `^5.104.5`; development only             |
| `@tanstack/react-table`          | 9.3.1 / 2026-10-12                 | **9.3.1** / 2026-10-12    | `>=18`; adopt v9, not v8 examples                                          |
| `@tanstack/react-form`           | 1.33.5 / 2026-08-11                | **1.33.5** / 2026-08-11   | `^17.0.0 \|\| ^18.0.0 \|\| ^19.0.0`; adopt stable v1                       |
| `@tanstack/zod-form-adapter`     | 0.42.1 / 2025-02-20                | 0.42.1 / 2025-02-20       | Zod `^3.x`, form-core 0.42.1; incompatible with our Zod 4 / Form 1, reject |
| `@tanstack/charts`               | 1.1.0 / 2026-10-09                 | 1.1.0 / 2026-10-09        | React/DOM `^18.0.0 \|\| ^19.0.0` as optional framework peers; adopt        |
| `@tanstack/react-charts`         | 1.1.0 / 2026-10-09                 | 1.1.0 / 2026-10-09        | React/DOM `^18.0.0 \|\| ^19.0.0`, charts 1.1.0; adopt                      |

Registry sources: [Router](https://registry.npmjs.org/@tanstack/react-router), [plugin](https://registry.npmjs.org/@tanstack/router-plugin), [Query](https://registry.npmjs.org/@tanstack/react-query), [devtools](https://registry.npmjs.org/@tanstack/react-query-devtools), [Table](https://registry.npmjs.org/@tanstack/react-table), [Form](https://registry.npmjs.org/@tanstack/react-form), [old adapter](https://registry.npmjs.org/@tanstack/zod-form-adapter), [Charts core](https://registry.npmjs.org/@tanstack/charts), [React adapter](https://registry.npmjs.org/@tanstack/react-charts). Each exposes `time`, `dist-tags`, and version manifests with licence, peers and dependencies.

**Correction to the issue's premise:** Charts started publishing on 2026-07-29 and was pre-alpha 0.x. The last 0.x was 0.18.0 (2026-09-10), followed by [1.0.0 on 2026-10-03](https://github.com/TanStack/charts/releases/tag/v1.0.0) and [1.1.0 on 2026-10-09](https://github.com/TanStack/charts/releases/tag/v1.1.0). Its [compatibility policy](https://tanstack.com/charts/latest/docs/compatibility) now describes a stable API. We must not describe current Charts as pre-alpha or install historical 0.x to match the issue. The earlier breaking-change risk explains caution; the remaining risk is a young stable project and a migration we do not yet need. The current [React quick start](https://tanstack.com/charts/latest/docs/framework/react/quick-start) uses `@tanstack/charts/react`; `@tanstack/react-charts` is also published and was the adapter measured here. This is distinct from the older unscoped `react-charts` project.

Maintenance evidence: Router/plugin published on October 22, Query on October 26, Table on October 12, and Charts on October 9. Form's stable line last published August 11, while its `alpha` tag is 2.0.0-alpha.3 (October 23); this is active v2 development, not evidence that v1 is abandoned. Stay on v1 and review its support trajectory. The old Zod adapter is from February 2025 and couples to pre-v1 Form. These are release observations, not promises of an SLA. Router/Query's rapid cadence and Table's recent major need reviewed updates and exact pins.

#### TypeScript 7 and Zod

All measured entry points passed `typescript@7.0.2` native `tsc --noEmit`, with `strict`, `skipLibCheck: false`, bundler resolution and React JSX. A second pass also enabled `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` and `isolatedModules`. This includes generated file routes, Table v9, Charts and Form with Zod 4.6.7. Vite transpilation alone would not prove type compatibility.

No selected runtime library requires the TypeScript JavaScript compiler API. The measured plugin 1.168.48 / generator 1.167.46 use Babel-related tooling rather than importing `typescript`; file generation and auto-splitting succeeded with TS 7 installed and no TS 6 dependency. **No new TS 6 island is justified.** This is a small consumer smoke check, not exhaustive upstream TS 7 certification. Router's checked package scripts still name TS 5.6–5.9 type tests. Query documents a recent-TypeScript support window and warns that type changes can ship in patches. Re-run the actual workspace typecheck and inference tests on adoption/upgrades; do not hide a failure by downgrading the web compiler or widening types to `any`. Existing Astro/OpenAPI tool exceptions from ADR 0003 remain separate.

[Form's native Standard Schema support](https://tanstack.com/form/latest/docs/framework/react/guides/validation) accepts Zod 4.6.7 contracts directly; no adapter or duplicate Zod version is needed. Router search validation can use an explicit validator calling Zod `safeParse`, without another adapter. Query/Table/Charts do not require Zod. The file plugin's own Zod range is `^4.5.4`, compatible with 4.6.7. Before implementation, recheck the complete lockfile against ADR 0005; scratch install used `minimumReleaseAge: 10080` without exclusions, so transitive release ages were also enforced.

### Bundle measurement

Scratch directory `/tmp/tanstack-spike` (outside the worktree), removed after measurements. No server was started. Node 26.13.0, pnpm 12.16.1, Vite 8.3.5, `@vitejs/plugin-react` 6.1.2, React/DOM 19.3.1, React types 19.3.0. Each variant is an independent minimal client app with a `createRoot` entry and production build; library pins are the eligible versions above. `build({ configFile: false, plugins: [react()], build: { minify: true, sourcemap: false, manifest: true } })` uses Vite's default target. Sum each emitted JS/CSS file compressed separately with Node `gzipSync(bytes, { level: 9 })`; exclude HTML, manifests and source maps. No CSS was emitted. **1 KiB = 1024 bytes.** Baseline is a React-rendered button, not a production TalentStroom build.

| Variant                                                   | Total gzip (bytes) | Total KiB | Delta vs baseline KiB |
| --------------------------------------------------------- | -----------------: | --------: | --------------------: |
| React baseline                                            |             67,723 |     66.14 |                     — |
| Router code-based, two lazy pages                         |             94,510 |     92.29 |            **+26.16** |
| Router file-based, plugin auto-splitting, same pages      |             94,549 |     92.33 |                +26.20 |
| Query provider, one query and invalidation                |             77,218 |     75.41 |             **+9.27** |
| Query + dev-only devtools import in production            |             77,231 |     75.42 |                 +9.29 |
| Query + devtools forced on (diagnostic only)              |            155,709 |    152.06 |                +85.92 |
| Table v9 sorting, selection, pagination, visibility       |             82,028 |     80.11 |            **+13.97** |
| Form, field state + submit, without Zod                   |             83,639 |     81.68 |            **+15.54** |
| Form + Zod 4.6.7 validation                               |            105,773 |    103.29 |                +37.16 |
| Charts 1.1.0 + React adapter, SVG bar with axes/grid      |            103,541 |    101.11 |                +34.98 |
| Existing `BarChart` + shared `chart.tsx`, same two values |             69,217 |     67.59 |                 +1.46 |

Router variants both render root navigation/Outlet, `/` and `/about`, with identical page text. Code-based uses `createRoute` and `lazyRouteComponent`; file-based uses `createFileRoute`, a generated tree and `tanstackRouter({ target: 'react', autoCodeSplitting: true })` **before** React's plugin. The manifest confirms two lazy page chunks in each. Code-based initial JS is 94,242 bytes gzip plus 268 lazy bytes; file-based initial JS is 94,294 plus 255 lazy bytes. The plugin itself is build tooling and adds no browser bundle. Resolve scratch paths to their real path on macOS so `/tmp` versus `/private/tmp` does not prevent the splitter recognizing route files.

Table uses v9 `useTable`/`tableFeatures`, the four named features, sorted/paginated row models and rendered cells. Form uses `useForm`, one input and `handleSubmit`; the Zod variant validates a two-character minimum on blur/submit. Charts uses `defineChart`, `barY`, compact band/linear scales and the React `Chart` SVG renderer. The existing SVG variant copies the two relevant files into scratch (no workspace dependency) and includes its data table/tooltips; the comparison is illustrative, not identical feature coverage. Query's devtools variant uses `import.meta.env.DEV`; its 13-byte difference is bundler output variation, not the devtools UI shipping. A separate diagnostic imports `@tanstack/react-query-devtools/production` and mounts it unconditionally to measure the real payload: +76.65 KiB over Query alone (92,933 initial + 62,776 lazy bytes gzip). That forced variant is not the shipping configuration.

The Zod variant is +21.62 KiB over Form alone. It is not an incremental cost if the same Zod code is already loaded on that route. Likewise, shared React/Store code and chunk compression mean these independent deltas **must not be summed as an application forecast**. Adoption issues must compare real application builds after the demo PRs merge. These are build/type measurements, not browser interaction, accessibility or performance certification.

## Decision

**Adopt Router, Query, Table and Form (option 2), and — by owner decision — TanStack Charts behind our chart API.** Dependencies are added only in their implementation issues, exactly pinned in the catalog. No TanStack Start, SSR, replacement API transport or backend changes.

### Router — code-based route tree (#423)

Use `@tanstack/react-router` **1.170.46**, without `router-plugin`. File-based routing is viable and gives automatic splitting, but adds a generator, conventions and a larger build dependency graph (Babel, unplugin, watcher, generator). Its measured runtime size is effectively identical. We already have a centralized metadata table; explicit routes let us preserve paths/layouts/flags with fewer changes. Reconsider file routes if maintaining the explicit tree becomes costly.

Build an explicitly inferred route tree with literal paths and `Register` augmentation, rather than mapping `RouteDef.path: string` and losing navigation types. Keep title/access/demo metadata as typed static route data. Navigation points at typed router destinations; sidebar active state comes from router matches. Replace both the document click interceptor and manual history helpers together, preserving modified clicks, external links, target/download behaviour, hashes, back/forward and replace redirects.

Use pathless auth and dashboard layout routes rendering the existing `AuthLayout` and `Workspace` with an `Outlet`. A shared root `beforeLoad` awaits the session/organization result and applies the matrix below **before** the layout guards and page loaders. It must not redirect a transient loading/error state as if it were a guest. Keep loading/error/retry/resend/sign-out UI. A dashboard `beforeLoad` requires a resolved active membership; the auth layout is not globally guest-only.

| Resolved state                                                           | Requested path                                                                                      | Existing behaviour to preserve                                         |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Guest (including session 401)                                            | `/inloggen`, `/registreren`, `/e-mail-bevestigen`, `/wachtwoord-vergeten`, `/wachtwoord-herstellen` | Allow auth screen                                                      |
| Guest                                                                    | Any other path, including picker/unknown                                                            | Replace with `/inloggen`                                               |
| Member, active organization absent from returned memberships (also null) | Email verification, forgot/reset password                                                           | Allow auth screen                                                      |
| Member, no active organization                                           | Any other path                                                                                      | Replace with `/organisatie-kiezen`; allow picker itself without a loop |
| Member, active organization matches returned membership                  | `/inloggen` or `/registreren`                                                                       | Replace with `/`                                                       |
| Member, active organization                                              | Picker or other public auth path                                                                    | Keep auth layout/screen; picker remains reachable                      |
| Member, active organization                                              | Enabled dashboard route                                                                             | Allow dashboard layout/page                                            |
| Member, active organization                                              | Unknown or disabled demo route                                                                      | Dashboard 404                                                          |
| Loading / non-401 session or organization error                          | Any path                                                                                            | Loading / session-error recovery UI; no guest redirect                 |

Preserve sign-in refresh to `/`, expiry to `/inloggen`, cancellation, localized titles, document language and heading focus after navigation. Capture callback `token`/`error` parameters in memory and replace the current URL before router search/cache/devtools can retain them; never serialize tokens into router state, query keys or logs. Retain one-use callback handling and existing auth tests.

`VITE_DEMO_PAGES` retains its exact semantics: unset means `import.meta.env.DEV`, otherwise only the string `"true"` enables it. A disabled demo is absent from navigation and resolves to 404 after normal guards, including direct links. PR #419's enabled demo auth screens (`/paginas/authenticatie/…`) render their own auth frame, with no API calls, before the real-session guard; preserve that explicit demo exception rather than making all dashboard demos public.

Lazy-load page, pending/error and 404 UI using code-based lazy APIs; critical path/search/guard metadata stays eager. Use the post-#420 localized `NotFound` in the dashboard layout. Avoid speculative authenticated data prefetch until #424 supplies scope-safe Query options.

Use `validateSearch` with allowlisted primitives/enums: bounded page/page-size, known sort/tab values. Invalid values fall back safely, with typed navigation updates. Names, emails, candidate text, free-text searches and credentials never enter search params. Development-only `preview: 'dashboard' | 'guest'`, `theme: 'light' | 'dark'` and gallery handling are harness state, not production authorization.

Harness mapping keeps the **same pathname** and adds preview context; it creates no public `/preview/*` routes:

- `/<dashboard-path>?preview=dashboard` → the same enabled dashboard route under `Workspace`, synthetic user/organization, without a session API call; unknown/disabled paths show 404.
- `/inloggen?preview=guest` (and register/recovery equivalents) → the same auth route with a guest stub transport, as #419; member destinations still follow guest redirects.
- `/paginas/authenticatie/<demo>` → the flagged demo auth route; `?preview=guest` must not turn it into a real auth action.
- `?gallery` remains the dev-only gallery; theme parameters continue to work for screenshots. Keep current entry-point precedence (gallery, dashboard preview, enabled demo auth, then normal/guest-preview app).

Create harness context and imports only behind `import.meta.env.DEV`; production ignores preview and uses real session guards, even if `VITE_DEMO_PAGES=true`. Harness state must survive router link navigation for the screenshot session without being applied to real API requests. Test the production build's lack of preview bypass as well as the development paths.

### Query — private, organization-scoped memory (#424)

Use Query **5.104.5** and matching devtools. One private in-memory QueryClient per browser app/session lifetime; no persistence, dehydration, service-worker storage, cross-tab data sharing or shared caches. Query replaces server-state effects, not local form/table state. Keep openapi-fetch as the typed transport and the separate Better Auth transport for auth endpoints. Use the client's public exports only.

Key factories use `['org', organizationId, resource, operation, safeParameters] as const`, for example `['org', organizationId, 'vacancies', 'list', { page: 1, sort: 'created-desc' }]`. Every organization-owned query **and mutation key** contains the verified organization ID; an organization cannot be inferred solely from a mutable header or closure. Safe parameters distinguish result variants. No names, emails, profile fields, free text, credentials or callback tokens in keys/metadata/URLs. Do not put sensitive search terms into a cache key; keep such results in a scoped transient view and send filters in the approved request body. New detail-query identifiers need a privacy review rather than using a natural identifier as a key.

Session and `/me/organizations` are bootstrap exceptions, keyed `['session']` and `['me', 'organizations']`, scoped to the private client lifetime and cleared on every identity/context transition. They contain no user ID/email in keys. Enable organization queries only after the active ID is confirmed in the returned memberships. Capture the ID at request start, pass Query's AbortSignal through openapi-fetch, and verify the context generation before applying responses or mutation callbacks. Router loaders call `ensureQueryData` with the same options factories; Query owns server data, with no second personal-data cache in Router loader results.

Organization switch/sign-out/expiry is a lifecycle barrier:

1. Stop rendering the previous organization's content; disable queries, prefetch and new submissions. Advance a context generation, abort transport work and `await cancelQueries()`. Mutation transport cancellation is explicit: Query does not undo server writes or automatically cancel mutations.
2. Clear both query and mutation caches (`queryClient.clear()`), reset Router's cached matches/loaders and remove old component references. Gate late mutation completions/invalidation/optimistic rollbacks by the old generation. Do not use cross-organization `keepPreviousData`/placeholder results.
3. Perform the switch/sign-out operation with a dedicated lifecycle signal. For switching, re-fetch session and memberships after the server rotates the cookie, confirm the new active membership, then create/use an empty client and invalidate router context before re-enabling the new view. Never populate the new organization from the requested ID alone.
4. On sign-out/401 expiry, discard caches even if a request was in flight. A failed explicit sign-out keeps the existing error/retry experience but must not restore discarded tenant data. A failed switch reloads authoritative context into an empty cache before any tenant UI resumes.

Handle organization-mismatch/forbidden responses by discarding stale scope and refreshing context; a cookie change in another tab must not revive old cached content (a context-change notification may carry an invalidation signal, never cached data). Test a deliberately late old-org response and mutation callback, rapid switches and sign-out, not only two settled queries. Server authorization remains mandatory regardless of client freshness.

Defaults: `staleTime: 30_000`, `gcTime: 300_000`, focus/reconnect refetch enabled for ordinary reads; session/membership queries use `staleTime: 0` and no retries. Other queries retry **at most once**, only network failures and 5xx; aborts and all 4xx (including 401/403/409/422/429) do not retry automatically. Mutations use `retry: false`; no offline mutation queue. A mutation invalidates only its captured organization prefix. Sensitive views may use `gcTime: 0`; no setting overrides lifecycle clearing.

openapi-fetch returns `{ data, error, response }`; query functions must throw on failure. Parse `application/problem+json` with the exported `ProblemDetails`/`ValidationProblem` contracts; expose a sanitized typed error carrying status, allowlisted problem type, safe request ID and field paths/codes. Do not render/log arbitrary `detail`, `instance`, server strings or submitted values. Non-problem/network errors use a generic i18n message. Better Auth failures retain `errorKey` semantics because those endpoints need not return RFC 9457. Map known problem types/statuses to Dutch-source i18n keys and known field errors. Devtools load only under `import.meta.env.DEV`, using synthetic data; verify no devtools UI/chunk in production. Never export a cache dump containing personal data.

### Table — headless beneath DataTable (#425)

Use Table **9.3.1** in `packages/ui`; use its v9 `useTable`/`tableFeatures` API, not the v8 `useReactTable` recipe. Select only sorting, selection, pagination and visibility features. Map `DataColumn` and `sortValue` internally, retaining `DataTableProps`, existing imports and callbacks. Keep `rowKey` as stable row identity, the Dutch numeric-aware string comparator, ascending/descending toggle behaviour, controlled `sort` and `selectedIds`, and selection of the supplied rows. Default rendering remains all rows/all columns. Pagination/visibility controls are additive optional props with existing defaults; do not expose TanStack types publicly or silently paginate existing tables. Density stays a CSS/UI concern.

Keep native table/caption/header semantics, sortable buttons/`aria-sort`, checkbox labels and indeterminate selection, keyboard focus, scroll hint/region, loading `aria-busy`/status, skeleton and empty state. Headless state does not supply accessibility. Define page selection separately from all supplied rows before enabling pagination; add regression tests before internals change. Migrate demo tables without changing synthetic data or the public API.

### Form — Standard Schema contracts (#426)

Use Form **1.33.5** with Zod **4.6.7** already in the catalog; **no Zod adapter**. Import reusable schemas from `@talentstroom/contracts`, not internal paths. Current contracts include organization creation but no exported login/register/profile/contact schemas: inventory post-merge forms first. Add genuinely shared request schemas to the contracts public API where appropriate; keep demo-only or presentation-only schemas local, and do not invent backend endpoints or change Better Auth's request contract as part of the migration.

Validate on blur and submit; use targeted subscriptions to avoid rerendering whole forms on each keystroke. Standard Schema validation does not substitute parsed/transformed output: explicitly parse the submitted value with the shared schema before transport (for example organization-name trimming). Field defaults must reflect schema input types. Preserve autocomplete, password handling, busy/duplicate-submit prevention, one-use token capture and generic authentication errors. Demo contact/profile/validation and demo auth forms remain local with no real mutations.

Map Zod issue code/path and allowlisted server validation errors to `@talentstroom/i18n` keys (Dutch source, English parity); do not display default English Zod text or echo submitted values. Use an error summary pattern (there is no existing exported `ErrorSummary` component): after an invalid submit focus the summary, link each error to its input, preserve entered values, and wire `aria-invalid`/`aria-describedby` to stable field-error IDs. Announce async submission errors without duplicate live announcements. Cover keyboard submission, field focus, transformed values, localized errors and screen-reader semantics. Keep passwords/tokens/form values out of devtools, logs and query keys. Auth-form changes wait for ADR acceptance and security review.

### Charts — adopt TanStack Charts behind our chart API (#427)

**Owner decision (2026-10-30): use TanStack Charts.** The spike recommended keeping our SVG charts (TanStack bar ≈ +33.5 KiB gzip versus our bar, and stable 1.x is less than a month old). The owner chose TanStack Charts for consistency with the rest of the TanStack data layer; this section records that decision and its guard rails.

- Pin the current stable 1.x release that passes the 7-day rule (1.1.0 at the time of writing) in the catalog, with its React adapter.
- Keep `@talentstroom/ui` as the only entry point: `BarChart`, `LineChart`, `DonutChart`, `ChartLegend` and sparklines keep their public props and are reimplemented on TanStack Charts, so pages do not import the library directly.
- Parity before replacing each chart: design tokens for colours (light/dark), keyboard focus and tooltips, the accessible data-table alternative, reduced motion, and deterministic rendering for the screenshot harness.
- Lazy-load chart code in the routes that use it, so the auth pages and the shell do not pay for it; measure the real route bundle in #427.
- Rollback: the wrapper API lets us return to the SVG implementation without touching pages.

### Migration order and suggested issue edits

These are recommendations for the existing issues; this spike does not edit them or create duplicates.

| Issue       | Dependency / refined scope and acceptance criteria                                                                                                                                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| #423 Router | Wait for ADR acceptance and merged #416–#420; pin 1.170.46, choose code-based tree, inventory all final paths including demo auth. Add failing guard-matrix/navigation tests first, production demo/preview tests, typed search tests and existing harness parity. Mark authentication/memberships as sensitive; no authorization-policy change. |
| #424 Query  | Explicitly depends on #423 and accepted ADR; pin Query/devtools 5.104.5. Test empty caches on switch/sign-out/expiry, aborted and late responses/mutations, failed transitions, mismatch and bootstrap refresh. Check organization and authentication sensitivity boxes; require security review. Preserve API and auth transports.              |
| #425 Table  | After #424, can proceed independently of #426/#427; pin v9 9.3.1, update implementation notes to its API. Tighten “unchanged or migrated” to existing public API preserved, additive pagination/visibility only; test sorting/selection/a11y and real-build size.                                                                                |
| #426 Form   | After #424 and ADR acceptance; pin 1.33.5, native Standard Schema with existing Zod 4.6.7. Inventory missing shared schemas; reject old adapter. Preserve auth requests, i18n/error summary and demo-local submits; mark auth sensitivity, retain auth regression/security review.                                                               |
| #427 Charts | After #424. Adopt TanStack Charts (stable 1.x, >= 7 days old) behind the existing `@talentstroom/ui` chart components with parity for tokens, focus/tooltips, data-table alternatives, reduced motion and deterministic screenshots; lazy per route; measure the route bundle.                                                                   |

Router then Query are sequential because Query integrates with Router context/loaders. Table, Form and Charts may then proceed in parallel worktrees. Implementation follows AGENTS.md's failing BDD test first; keep each PR small and AI-labelled, with human review, security implications and uncertainty stated. All issues should use **`pnpm check`** (format, type-aware lint, typecheck, tests), plus the applicable existing Playwright harness on dedicated permitted ports. No changes to CI/CD, backend scope checks or migrations are part of this plan.

## Consequences

- Typed navigation/search and reusable server-state/form/table primitives reduce custom state logic while our API and accessible UI remain the public boundary.
- Router/Query/Form touch sensitive lifecycle code. A route guard regression or late cache write can expose stale tenant content locally even when the server rejects unauthorized requests; acceptance and adversarial lifecycle tests are prerequisites.
- Query holds personal data in private memory. Cache contents, mutation variables and devtools need the same privacy discipline as existing app state; persistence and personal-data logging remain prohibited.
- New dependencies increase supply-chain and update work. Runtime peers permit React 19.3, and smoke checks pass TS 7, but full-app inference, auth parity, concurrent rendering and accessibility remain implementation gates. MIT notices must remain available in distributed third-party notices.
- Table v9 and young Charts v1 invalidate older examples/assumptions. Form v2 is alpha; an automatic major/alpha upgrade is out of scope. Catalog pins and the age rule stay intact; no fresh-release exclusions or toolchain downgrade.
- The selected Router/Query enter the app shell; Table/Form should stay in routes needing them. Bundle deltas are indicative and shared code may reduce incremental cost. SVG avoids chart migration cost now, while keeping a later switch localized.

## Rollback

- Router: restore the prior History API route table/helpers and guard tests as one change, preserving the auth matrix, callback cleanup, focus and merged route inventory. Do not leave two active navigation interceptors.
- Query: stop observers, abort/gate in-flight work, clear query/mutation and router caches, then restore transport-driven session/organization loading. Keep the cache-transition regression tests; remove provider, hooks, devtools and catalog pins only after all callers migrate back.
- Table/Form: replace internals behind the existing UI props with the previous implementation; retain accessibility, input/parse and auth behaviour tests. Remove unused pins. Reverting a library is not permission to weaken scope or auth rules.
- Charts: no dependency to roll back. Revert individual SVG extensions if necessary, retaining the accessible data-table alternative.
- Any rollback changing authentication or tenant semantics requires an accepted ADR under rule 1; a behaviour-preserving library rollback must remain consistent with this decision.

## Sources (checked 2026-10-30)

- npm registry manifests and publication timelines linked in the release table (UTC timestamps; retrieved with registry HTTP requests). GitHub issue #421/#422 and follow-ups #423–#427 read via `gh issue view`; open PR bodies/file lists and #419 auth diff reviewed via `gh pr view`/`gh pr diff` on this date.
- TanStack Router: [authenticated routes / beforeLoad](https://tanstack.com/router/latest/docs/guide/authenticated-routes), [code-based routing](https://tanstack.com/router/latest/docs/guide/code-based-routing), [code splitting](https://tanstack.com/router/latest/docs/guide/code-splitting). Undated living documentation; package/plugin inspection at versions above.
- TanStack Query: [TypeScript support and patch-level type changes](https://tanstack.com/query/latest/docs/framework/react/typescript), [query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys), [cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation), [QueryClient clear](https://tanstack.com/query/latest/docs/reference/QueryClient). Undated living documentation; lifecycle policy/defaults here are our decisions.
- TanStack Table: [v9 quick start](https://tanstack.com/table/latest/docs/framework/react/quick-start), [v9 migration](https://tanstack.com/table/latest/docs/framework/react/guide/migrating). Undated living documentation, checked against installed 9.3.1 declarations.
- TanStack Form: [validation / Standard Schema](https://tanstack.com/form/latest/docs/framework/react/guides/validation), [submission handling](https://tanstack.com/form/latest/docs/framework/react/guides/submission-handling). Undated living documentation, checked with Form 1.33.5 and Zod 4.6.7.
- TanStack Charts: [1.0 release](https://github.com/TanStack/charts/releases/tag/v1.0.0) (2026-10-03), [1.1 release](https://github.com/TanStack/charts/releases/tag/v1.1.0) (2026-10-09), [stable compatibility](https://tanstack.com/charts/latest/docs/compatibility), [React quick start](https://tanstack.com/charts/latest/docs/framework/react/quick-start). The latter pages are undated living documentation.
- Repository evidence: ADRs 0003/0005/0013/0014; catalog; web app routing/auth/navigation; api-client public client and generated types; contracts exports; DataTable and chart implementations. Scratch production builds and native TS 7 checks described above; no spike code or installed dependencies retained in the repository.
