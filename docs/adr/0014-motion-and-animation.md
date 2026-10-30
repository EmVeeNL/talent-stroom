# 0014 — Motion and animation

- **Status:** Accepted with owner amendment (2026-10-30: Motion broadly)
- **Date:** 2026-10-30
- **Resolves:** —
- **Issue:** #397 (epic #369; follow-ups #398–#402)

## Context

The redesign (epic #369, ADR 0013) asks for motion in overlays, controls, lists, routes and the Kanban board. The design kit has no motion foundation. The only guidance is "Ondersteun `prefers-reduced-motion`" (`docs/images/redesign/docs/foundations/05-accessibility-responsive.md`) and "Reduced motion and no indefinite loading" for the skeleton (`components/Skeleton.md`).

The current state of the code:

- `packages/ui/src/tokens.css` / `tokens.ts` define two motion tokens: `--ts-duration-fast` (120ms) and `--ts-duration-base` (200ms).
- About ten components already use CSS transitions or keyframes: Button, Header, Sidebar width, Sheet, Toast, Skeleton, Progress and the spinner. Each switches them off in its own `@media (prefers-reduced-motion: reduce)` block. Easing is the literal `ease` or `ease-out`.
- `Dialog`/`AlertDialog` are native `<dialog>` elements opened with `showModal()`, so they sit in the top layer.
- The Playwright harness (`apps/web/playwright.config.ts`) already runs with `reducedMotion: "reduce"` and takes screenshots with `animations: "disabled"`.
- React 19.3.1 is pinned in the catalog. Its stable build exports `<ViewTransition>` and `addTransitionType`; we checked this in `react.production.js` and `@types/react` 19.3.0.

Constraints: plain CSS on `--ts-*` tokens with no CSS-in-JS (ADR 0002 and 0013); WCAG 2.2 AA; the 7-day release-age rule and exact catalog pins (ADR 0005). The repository is public and the product handles personal data, so a dependency must have a clear licence and a low supply-chain surface. Recruiters work on mid-range laptops, and motion must never slow down data entry.

## Options considered

All facts below were checked on 2026-10-30 against the npm registry, the vendors' documentation and the installed React package.

1. **Motion** (`motion`, import from `motion/react`; successor of `framer-motion`, same codebase): declarative React API, `AnimatePresence` for exit animations, `layout` for FLIP, springs, gestures and drag. Licence MIT. It releases very often: 14.0.0 came out on 2026-10-02, and nine minors and patches followed in October. The newest version allowed under ADR 0005 today is **14.6.0** (2026-10-22); 14.8.0 is from 2026-10-29. Peer dependency is React `^18 || ^19`. For reduced motion, `<MotionConfig reducedMotion="user">` turns off transform and layout animations and keeps opacity and colour; there is also a `useReducedMotion()` hook. For tests, `MotionGlobalConfig.skipAnimations` / `instantAnimations` exist (checked in 14.6.0). `LazyMotion` + `m` can move the feature code into a lazy chunk.
2. **GSAP 3.15.0** (2026-04-13) **+ `@gsap/react` 2.1.2** (2025-01-15): imperative timelines, the `Flip` plugin for layout, `gsap.matchMedia()` for reduced motion, and `useGSAP()`, which scopes animations in `gsap.context()` and reverts them on unmount (the StrictMode double effect). Since the Webflow acquisition, GSAP is free under the **"Standard 'no charge' licence"** (effective 2025-04-30, last modified 2025-05-30). Commercial use, including the former bonus plugins, is allowed. The licence is **proprietary, not OSI**: it prohibits use in no-code visual animation builders that compete with Webflow, Webflow may terminate it for non-compliance, and Webflow may change it for future versions. GSAP has no presence or exit primitive for React; we would have to write mount/unmount state ourselves.
3. **CSS only + View Transitions API**: zero dependencies, and it is already how the codebase works.
   - Transitions and keyframes on `transform`/`opacity` cover hover, press, check, tooltip and toast enter.
   - `@starting-style` + `transition-behavior: allow-discrete` (Baseline since Firefox 129, Aug 2024; Safari 18 for the combination with `display`) give **enter and exit** animations for native `<dialog>` and `[popover]` without unmount bookkeeping. Animating the exit out of the top layer also needs `overlay`, which is not Baseline; where it is missing, the exit is instant.
   - Same-document View Transitions (`document.startViewTransition`) have been **Baseline Newly available since 2025-10-14**: Chrome 111, Safari 18, Firefox 144. React 19.3 integrates them through `<ViewTransition>` and transitions (`startTransition`), with no extra package.
   - Limits: there is no gesture or drag physics. View transitions animate **snapshots**: the `::view-transition` overlay captures pointer input while it runs unless we set `pointer-events: none`, and it needs unique `view-transition-name`s. List exit and reorder only work inside a transition.
4. **Hybrid**: CSS (and View Transitions) by default; a library only where CSS is weak, which is drag with layout animation and swipe gestures. The library is loaded only on the screens that need it.
5. **`@formkit/auto-animate` 0.10.0** (2026-07-10, MIT): one-line FLIP for list add, remove and reorder, and it respects `prefers-reduced-motion` by default. It is tiny, but it offers little control: no presence for overlays, no gestures, and it animates whatever the DOM does. We considered it as a lighter alternative to Motion for lists only.

### Bundle measurement

These are minimal Vite 8.3.5 + React 19.3.1 production builds of the same app: a panel with presence enter/exit, a list with add/remove/reorder (layout animation), and one spring. Sizes are gzip -9 of all emitted JS and CSS. Versions are the newest that pass the 7-day rule: motion 14.6.0, gsap 3.15.0, @gsap/react 2.1.2, @formkit/auto-animate 0.10.0. The build was scratch and was not kept.

| Variant                                                                 | Total gzip  | Delta vs. plain React                     |
| ----------------------------------------------------------------------- | ----------- | ----------------------------------------- |
| Plain React (baseline)                                                  | 66.4 KB     | —                                         |
| CSS `@starting-style` + React `<ViewTransition>` + CSS `linear()`       | 66.6 KB     | **+0.3 KB**                               |
| `@formkit/auto-animate` (presence + reorder, no spring)                 | 69.1 KB     | +2.7 KB                                   |
| Motion `m` + `LazyMotion` `domAnimation` (presence + spring, no layout) | 96.7 KB     | +30.3 KB                                  |
| GSAP + `Flip` + `@gsap/react`                                           | 101.3 KB    | +34.9 KB                                  |
| Motion `motion.*` (full) / `m` + `LazyMotion` `domMax` (sync)           | 110.2 KB    | +43.9 KB                                  |
| Motion `m` + `domMax` loaded via dynamic `import()`                     | 82.4 + 31.2 | **+16.0 KB initial**, +31.2 KB lazy chunk |

(1 KB = 1024 bytes.) Layout animation (`domMax`) is most of Motion's cost. Synchronous `LazyMotion` saves nothing once layout and presence are used; only async feature loading moves the weight out of the initial chunk.

### Comparison

| Criterion                    | Motion                                                                              | GSAP + @gsap/react                          | CSS + View Transitions                                                   | Hybrid (CSS + lazy Motion)               |
| ---------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------- |
| Size for our feature set     | +44 KB (+16 KB if lazy)                                                             | +35 KB                                      | ~0                                                                       | ~0 on most routes; +47 KB on Kanban only |
| Presence / exit              | `AnimatePresence`                                                                   | hand-written                                | `<dialog>`/`[popover]` + `@starting-style`; lists via `<ViewTransition>` | CSS; Motion where needed                 |
| Layout / reorder / drag      | `layout`, drag, gestures                                                            | `Flip`, Draggable                           | snapshots only, no drag                                                  | Motion on Kanban                         |
| React 19 + StrictMode        | yes (peer ^19)                                                                      | yes via `useGSAP` revert                    | native (React 19.3 `<ViewTransition>`)                                   | yes                                      |
| Uses our CSS tokens          | values passed from `tokens.ts`                                                      | values passed from `tokens.ts`              | `var(--ts-*)` directly                                                   | both                                     |
| Reduced motion               | `MotionConfig reducedMotion`, hook                                                  | `gsap.matchMedia()`, manual                 | `@media (prefers-reduced-motion)`                                        | both                                     |
| jsdom                        | needs `skipAnimations` + `matchMedia` stub                                          | runs on rAF; must stub/complete             | transitions don't run, final state immediately                           | mostly trivial                           |
| Playwright screenshots       | rAF springs not stopped by `animations: "disabled"`; use reduced motion / skip flag | same                                        | `animations: "disabled"` completes them                                  | same as CSS, flag for Motion             |
| Licence                      | MIT                                                                                 | proprietary "no charge", Webflow-controlled | n/a                                                                      | MIT                                      |
| Release churn vs. 7-day rule | high (several releases a week)                                                      | low                                         | n/a                                                                      | moderate (one pin, few call sites)       |

## Owner amendment (2026-10-30)

The owner chose **Motion (`motion/react`) broadly** instead of "CSS first, Motion only where CSS is not enough". This replaces the decision below where they conflict:

- `motion` (MIT) is added to the catalog in #398 (exact pin, 7-day rule) and used for overlays (Dialog, Sheet, Popover, menus, toasts), page/route transitions, list enter/exit/reorder, Kanban drag and layout animation, expand/collapse and micro-interactions where it improves feel.
- Bundle guard rails stay: `LazyMotion` with `domAnimation` features loaded via `import()` for the app, `domMax` (layout) only on routes that need it (Kanban, reorderable lists); components import from `@talentstroom/ui` motion helpers, never `motion/react` directly in pages.
- Unchanged from this ADR: motion principles, tokens (durations/easings exported as Motion transition presets), the reduced-motion policy (`MotionConfig reducedMotion="user"` plus our `data-motion` override), interruptible and non-blocking motion, focus management unaffected, deterministic screenshots (`MotionGlobalConfig.skipAnimations` in tests/harness), and plain CSS transitions remain fine for trivial hover/press states.
- Follow-up issues #398–#402 implement this amended approach.

## Decision

**Option 4, hybrid: CSS first, Motion only where CSS is not enough, loaded lazily.**

1. **Default: CSS transitions and keyframes on our tokens** for all micro-interactions and simple presence. This covers buttons, switch, checkbox and radio, tabs indicator, hover elevation, tooltip, toasts entering, skeleton and progress, and the sidebar.
2. **Overlays** (Dialog, AlertDialog, Sheet, Popover, menus) animate enter and exit with `@starting-style` + `transition-behavior: allow-discrete` on the native `<dialog>`/`[popover]` element. Where `overlay` is not supported, the exit is instant; that degradation is acceptable.
3. **Route and page transitions, org switch, expand/collapse and simple list enter/exit/reorder** use React 19.3 `<ViewTransition>` with `startTransition`. We always set `::view-transition { pointer-events: none }`, scope `view-transition-name`s per component, and keep durations at or below `--ts-duration-slow`.
4. **Motion (`motion/react`, MIT)** is admitted for **Kanban drag/drop with layout animation, toast swipe-to-dismiss, and interruptible springs that CSS cannot express**. It is used only as `m` + `LazyMotion` with features loaded via `import()`, wrapped by helpers in `@talentstroom/ui`, and imported only in route chunks that need it. It is pinned exactly in the catalog. It is added by the first issue that needs it (expected #401, Kanban; #399 if toast swipe lands first), never by #398.
5. **Not chosen:** GSAP, because the licence is proprietary and controlled by Webflow (it can be terminated or changed), it has no React presence primitive, and it is imperative. `@formkit/auto-animate`, because it overlaps with `<ViewTransition>` and offers too little control; we reconsider it only if view transitions fail for lists.

### Motion principles

1. **Purposeful.** Motion explains a change: where something came from, where it went, or what changed. No decorative loops, parallax or attention-seeking motion. Nothing animates on page load except skeleton-to-content.
2. **Short.** Micro-interactions use `fast`, overlays and toasts use `base`, larger surfaces, layout and routes use `slow`. Nothing exceeds 400ms. Exits run at about 75% of the enter duration and use the exit easing.
3. **Interruptible.** Every animation can be reversed or cut off mid-way. That means CSS transitions or springs, not chained timeouts; a second click wins.
4. **Never blocking input or focus.** State changes happen immediately and motion follows them.
   - Focus moves to the dialog when the enter animation starts. On close, focus returns at once while the exit runs.
   - An exiting element is `inert` (or has `pointer-events: none`) and is not announced.
   - Esc and close actions take effect at once for assistive technology.
   - No submit, navigation or keyboard handler waits for `transitionend` or `animationend`.
5. **Reduced motion first.** Each animation is designed with its reduced-motion variant from the start (see the policy below).
6. **Performance.** Animate only `transform` and `opacity` (`translate`/`scale` properties) where possible. The sidebar width transition is the one documented exception, and it must not reflow the content area every frame (#402 measures it). No layout reads inside animation frames. `will-change` is applied only while animating. Target 60 fps on a mid-range laptop.

### Motion tokens

Added to `tokens.css` and mirrored in `tokens.ts` (sync test). `tokens.ts` also exports numeric millisecond values for JS consumers; Motion takes seconds.

| Token                  | Value                             | Use                                                          |
| ---------------------- | --------------------------------- | ------------------------------------------------------------ |
| `--ts-duration-fast`   | `120ms` (exists)                  | hover, press, check, switch thumb, colour changes            |
| `--ts-duration-base`   | `200ms` (exists)                  | popover, menu, tooltip, toast, chips, tabs indicator         |
| `--ts-duration-slow`   | `320ms`                           | dialog, sheet, sidebar, expand/collapse, list reorder, route |
| `--ts-delay-tooltip`   | `500ms`                           | hover delay before a tooltip appears (not motion; kept here) |
| `--ts-ease-standard`   | `cubic-bezier(0.2, 0, 0, 1)`      | on-screen changes (move, resize, colour)                     |
| `--ts-ease-emphasised` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | elements entering (overlays, toasts, route in)               |
| `--ts-ease-exit`       | `cubic-bezier(0.3, 0, 1, 1)`      | elements leaving (accelerate out)                            |
| `springs.snappy` (TS)  | `{ stiffness: 400, damping: 34 }` | Motion drag/drop and swipe settle; no visible overshoot      |

Existing literal `ease` / `ease-out` usages move to these tokens in #398. Distances are small: at most 8px slide for popovers and toasts, `scale(0.96)` to `1` for dialogs; sheets slide their full width.

### Reduced-motion policy

- **Source of truth:** `prefers-reduced-motion: reduce`, plus `data-motion="reduce"` on `:root`, which the gallery toggle uses and which a later user setting can use. CSS uses both selectors. `useReducedMotion()` in `@talentstroom/ui` reads both and drives `<MotionConfig reducedMotion>`.
- **When reduced:** no movement. That means no translate, scale, layout/FLIP, view-transition morphs, count-up, sparkline draw-in or parallax. Changes are **instant**, or an **opacity crossfade at or below `--ts-duration-fast`** where an instant swap would be disorienting (overlays, route content). Infinite animations stop (skeleton shimmer, indeterminate progress stripe); the spinner keeps turning slowly because it is the only loading signal.
- **Kept:** essential feedback as instant state changes, such as focus ring, pressed and selected states, checkmarks and toast appearance. No information is carried by motion alone.
- **WCAG:** 2.2.2 (nothing moves for more than 5s without a pause control; toasts pause on hover and focus), 2.3.1 (no flashing) and 2.3.3 (motion from interaction can be turned off) are met.

### Tests and screenshots

- **jsdom (Vitest):** CSS animations don't run, so assert final state and classes, not timing. A shared setup stubs `matchMedia` (both values tested) and sets `MotionGlobalConfig.skipAnimations = true` once Motion exists. jsdom lacks `startViewTransition`, and React falls back to no animation, which is the path we test. Exit animations must not delay unmount or focus assertions.
- **Playwright visual harness:** keep `reducedMotion: "reduce"` and `animations: "disabled"`. Playwright's option completes CSS and Web Animations but **not** rAF-driven Motion springs, so Motion helpers honour reduced motion (instant) and a test flag. Screenshots always show final states, never mid-animation frames. A separate "Beweging" gallery run with `reducedMotion: "no-preference"` checks behaviour (classes, focus, end state), not pixels.
- **Performance:** #402 records Chrome Performance traces for dialog, sidebar and Kanban.

### Follow-up issues

| Issue | Uses                                                                                                                                                                       |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #398  | Tokens above; reduced-motion CSS (media + `data-motion`); `useReducedMotion`; CSS preset classes (fade, slide, scale-in, collapse); gallery "Beweging". **No dependency.** |
| #399  | CSS `@starting-style`/`allow-discrete` on `<dialog>`/`[popover]`; tooltip and toast enter in CSS; toast swipe with Motion (lazy) or a pointer-event CSS fallback           |
| #400  | CSS only (transitions; tabs indicator via `translate`/`scale`; count-up and draw-in via CSS or rAF with a reduced-motion bypass)                                           |
| #401  | `<ViewTransition>` for routes, lists, expand/collapse and org switch; **adds Motion** (catalog pin, lazy `domMax`) for Kanban drag/drop                                    |
| #402  | Reduced-motion suite (jsdom + Playwright `emulateMedia`), traces, harness rules above, `packages/ui/README.md` motion section                                              |

## Consequences

- Most screens ship no animation JavaScript. Only the Kanban route (and possibly toasts) pays about 47 KB gzip, lazily.
- Two mechanisms to learn: CSS/View Transitions and Motion. `@talentstroom/ui` wraps Motion so apps never import `motion` directly, which keeps a later swap cheap.
- Motion's release cadence means our pin is usually a few minors behind; Dependabot PRs for it will be frequent. That is a supply-chain surface (MIT, four packages: `motion`, `framer-motion`, `motion-dom`, `motion-utils`) we accept for one screen.
- View transitions are Baseline Newly available. Older Safari (<18) and Firefox (<144) get instant changes, which is acceptable because the motion is non-essential.
- Exit animations of top-layer overlays are Chromium-only until `overlay` is broadly supported.
- No personal data or network impact. The `tokens.css` additions are additive.

## Rollback

- **CSS parts:** set the duration tokens to `0ms` or remove the classes; behaviour is unaffected because nothing waits on animation events.
- **Motion:** remove the catalog entry and replace the ui helpers with a non-animated implementation, or with `<ViewTransition>` for the Kanban reorder. Call sites are limited to `@talentstroom/ui` helpers.
- If View Transitions misbehave (pointer capture, focus), drop `<ViewTransition>` wrappers; navigation still works without animation.

## Sources (checked 2026-10-30)

- npm registry (`npm view <pkg> time`): motion / framer-motion 14.6.0 (2026-10-22), 14.8.0 (2026-10-29); gsap 3.15.0 (2026-04-13); @gsap/react 2.1.2 (2025-01-15); @formkit/auto-animate 0.10.0 (2026-07-10).
- Motion: [Reduce bundle size](https://motion.dev/docs/react-reduce-bundle-size), [Accessibility](https://motion.dev/docs/react-accessibility).
- GSAP: [Standard "no charge" licence](https://gsap.com/standard-license) (effective 2025-04-30, modified 2025-05-30), [React guide](https://gsap.com/resources/React/).
- web.dev, [Same-document view transitions are Baseline Newly available](https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available) (2025-10-16).
- Chrome for Developers, [What's new in view transitions (2025)](https://developer.chrome.com/blog/view-transitions-in-2025).
- Bramus, [Keeping the page interactive while a View Transition is running](https://bram.us/2025/01/29/view-transitions-page-interactivity) (2025-01-29); CSSWG issue [#11596](https://github.com/w3c/csswg-drafts/issues/11596).
- React 19.3.1 / @types/react 19.3.0 in this repository: stable `ViewTransition` and `addTransitionType` exports.
