# @talentstroom/web

Vite + React recruiter app. Run `pnpm --filter @talentstroom/web dev` for normal development.

## Visual review

From the repository root:

```sh
pnpm visual:install # install the matching Playwright Chromium browser once
pnpm visual         # capture the gallery
```

On Linux, `pnpm visual:install --with-deps` also installs Chromium's system dependencies.
Playwright owns the Vite server on **127.0.0.1:5178**, uses strict port binding, and stops it
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

### Pending screen coverage and design differences

`/inloggen`, `/registreren` and `/organisatie-kiezen` do not exist in this worktree:
`App.tsx` currently renders the same placeholder Home for every non-gallery URL. Auth
captures are pending the screen implementation; screenshots of that placeholder would
misrepresent coverage. Once the screens land, add route-specific synthetic session and
organization fixtures using Playwright `page.route` interception before navigating.
Never connect visual captures to real sessions or personal data.

The redesign kit in `docs/images/redesign/` is the review authority (tokens and component
specifications take priority over historical mockup pixels). Existing UI still uses
Material Symbols Outlined and older tokens; migrating to Rounded and the new kit is
separate work. The harness checks the actual icon font so it also supports Rounded once
that migration lands. DPR 2/3, 200% zoom, interaction states and accessibility audits remain
separate checks from this initial screenshot matrix.
