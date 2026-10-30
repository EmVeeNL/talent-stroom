# @talentstroom/ui

Design tokens and core React components. Plain CSS, no CSS-in-JS runtime, no Tailwind.

```ts
import "@talentstroom/ui/tokens.css";
import "@talentstroom/ui/components.css";
import { Button, TextField, Tabs } from "@talentstroom/ui";
```

Components take already-translated strings; user-facing copy goes through `@talentstroom/i18n` in the app. Dev showcase: run `pnpm dev` and open `http://localhost:5173/?gallery`.

## Tokens

`src/tokens.css` (CSS custom properties) and `src/tokens.ts` (`cssVariables`, `darkCssVariables`, plus grouped light-theme views) are kept identical; `tokens.test.ts` fails when they drift. All contrast pairs are checked in both themes.

The default follows `prefers-color-scheme`. `data-theme="light"` / `"dark"` on the document root overrides it. `getThemePreference` and `setThemePreference` read/write `ts-theme` in local storage safely; setting `system` removes the attribute. `ThemeToggle` takes translated `label` and `labels` for its native system/light/dark radio group and synchronizes changes across tabs. The web app’s small static head script applies the stored override before rendering. A deployment with a strict CSP should authorize this exact script with its SHA-256 hash (recalculate whenever the script changes), without enabling `unsafe-inline`.

The dev-only, lazy-loaded gallery lives in `apps/web/src/gallery/`; its ordered page registry drives hash links such as `/?gallery#forms`. The header switches the gallery language and theme. Production builds exclude the gallery module.

Values come from the redesign design kit (`docs/images/redesign/`); the kit-to-token mapping and every WCAG 2.2 AA deviation are recorded in [ADR 0013](../../docs/adr/0013-redesign-design-kit.md). The gallery's Tokens page (`/?gallery#tokens`) shows all swatches with hex values and contrast ratios for both themes; add `&theme=light` or `&theme=dark` to force a theme for screenshots (not persisted).

- Typography: Asap Sharp. Sizes `--ts-font-size-{xs,sm,md,lg,xl,2xl,3xl,4xl}` = 12/14/16/18/20/24/30/36 px with matching `--ts-line-height-*` (16…44 px). Role shorthands for `font:`: `--ts-font-{hero,page-title,section-title,card-title,body,compact,caption,label}`. `.ts-tabular-nums` for KPIs and amounts.
- Palette (theme-independent): `--ts-primary-{50…900}`, `--ts-neutral-{0…900}`, `--ts-navy-*`, `--ts-accent-*`. Components use semantic tokens only.
- Semantic colours: `bg`, `surface`, `surface-muted`, `surface-raised` (popovers/dialogs), `text`, `text-muted`, `border` (decorative), `border-strong` (input boundaries), `primary`, `accent`, `success`, `warning`, `danger`, `info`, `violet`, `neutral`. Solid = fill/icon, `-subtle` = label background, `-text` = readable text. In the light theme `success`, `warning` and `accent` are decorative fills only.
- Navy sidebar: `--ts-sidebar-*` (same in both themes).
- Spacing `--ts-space-{0-5,1,2,3,4,5,6,8,10,12,16,20}` (2–80 px); radius `sm/md/lg/xl/full` = 6/10/14/20/9999 (inputs and buttons `md`, cards `lg`, modals `xl`); `--ts-border-width` 1 px; focus ring 2 px with 2 px offset.
- Shadows `--ts-shadow-{card,popover,modal}`; dark theme uses minimal shadows plus borders and `surface-raised`.
- Layout: `--ts-sidebar-width` 252 / `-collapsed` 68, `--ts-navbar-height` 64, `--ts-content-max-width` 1600, `--ts-control-height-{sm,md,lg}` 32/40/48, breakpoints 390/768/1024/1440 (`--ts-breakpoint-*`, `breakpoints` in TS; media queries use literals). Motion durations.

`contrast.ts` (`contrastRatio`, exported) plus `tokens.test.ts` assert every text pair (4.5:1) and UI/focus pair (3:1) in both themes, and pin each documented deviation.

## Component index

| Category               | Components                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations and layout | `Logo`, `Icon`, `Kbd`, `Card`, `Sidebar`, `Header`, `Breadcrumb`, `ThemeToggle`                                                              |
| Actions and navigation | `Button`, `Tabs`, `CommandPalette`                                                                                                           |
| Forms                  | `FormField`, `TextField`, `Textarea`, `NumberInput`, `Select`, `Switch`, `Checkbox`, `CheckboxGroup`, `RadioGroup`, `Slider`, `FileUploader` |
| Metrics and status     | `StatCard`, `TrendIndicator`, `Progress`, `Badge`, `StatusPill`, `StageBadge`, `FilterChip`                                                  |
| Data visualisation     | `LineChart`, `BarChart`, `DonutChart`, `ChartLegend`                                                                                         |
| Tables and lists       | `DataTable`, `Pagination`, `ActivityFeed`, `Avatar`                                                                                          |
| Filtering and controls | `SearchInput`, `Combobox`, `DateRangePicker`, `FacetedFilter`, `ViewSwitcher`                                                                |
| Overlays and feedback  | `Tooltip`, `HoverCard`, `Popover`, `Dialog`, `Sheet`, `AlertDialog`, `Toast`, `Toaster`, `AlertBanner`, `Skeleton`                           |

## Components

| Component             | Notes                                                                                                                                                                                                                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`              | `variant` primary/secondary/outline/ghost/danger/success/warning, `size` sm/md/lg, `icon` / `iconPosition` or `leadingIcon` / `trailingIcon`, `loading` (+ `loadingLabel`). Icon-only buttons are square and require `aria-label`. Loading sets `aria-busy`/`aria-disabled`, ignores clicks, keeps focus. `type` defaults to `button`.             |
| `TextField`           | `label`, `hint`, `error`, `required`; native text/email/password/url/number/search/date types. Pass translated `visibilityLabels: { show, hide }` for the password toggle; `shortcut` accepts a search hint such as `<kbd>⌘K</kbd>`. Label via `htmlFor`; hint and error joined in `aria-describedby`; `aria-invalid` and `role="alert"` on error. |
| `Badge`, `StatusPill` | Tones neutral/success/warning/danger/info. `StatusPill` adds a per-tone icon so status is not colour-only.                                                                                                                                                                                                                                         |
| `Card`                | `as` div/section/article, optional `title` (heading level configurable) and `actions`; titled section/article is labelled by its heading.                                                                                                                                                                                                          |
| `Tabs`                | WAI-ARIA tabs (automatic activation): roving tabindex, Left/Right (wrapping), Home/End, disabled tabs skipped, panels focusable. Controlled or uncontrolled.                                                                                                                                                                                       |
| `Icon`                | Typed Material Symbols Rounded ligature (16/20/24/32px; default 20px); `aria-hidden` by default, `label` gives `role="img"` + `aria-label`.                                                                                                                                                                                                        |

| Component                           | Notes                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                            | `variant` primary/secondary/ghost/danger, `size` sm/md/lg, `icon`, `loading` (+ `loadingLabel`). Loading sets `aria-busy`/`aria-disabled`, ignores clicks, keeps focus. `type` defaults to `button`.                                                                                                                       |
| `TextField`                         | `label`, `hint`, `error`, `required`. Label via `htmlFor`; hint and error joined in `aria-describedby`; `aria-invalid` and `role="alert"` on error.                                                                                                                                                                        |
| `Badge`, `StatusPill`, `StageBadge` | Tones come from `RECRUITMENT_STAGES` (`nieuw`, `in_behandeling`, `gesprek`, `aanbod`, `geplaatst`, `niet_geschikt`, `talentpool`). Subtle is the default. Solid is limited to neutral/info/danger for passing contrast; callers provide localized stage text via the exported label key. Icons or dots can accompany text. |
| `FilterChip`                        | `kind="toggle"` exposes `aria-pressed`, `kind="removable"` has a separately labelled close button, `kind="dropdown"` shows the expand affordance, and `kind="add"` shows a plus action.                                                                                                                                    |
| `Card`                              | `as` div/section/article, optional `title` (heading level configurable) and `actions`; titled section/article is labelled by its heading.                                                                                                                                                                                  |
| `Tabs`                              | WAI-ARIA tabs (automatic activation): roving tabindex, Left/Right (wrapping), Home/End, disabled tabs skipped, panels focusable. Controlled or uncontrolled.                                                                                                                                                               |
| `Icon`                              | Typed Material Symbols Rounded ligature (16/20/24/32px; default 20px); `aria-hidden` by default, `label` gives `role="img"` + `aria-label`.                                                                                                                                                                                |

The Material Symbols font itself must be loaded by the app (self-host; see `docs/images/implementation/material-symbols.md`).

## Layout and navigation

- `Sidebar`: recursive `items` (`id`, translated `label`, `icon`, `href`, optional `children` and link `onClick`), `activeId`, `collapsed`, and a `workspace` switcher slot. Native disclosure buttons use Space/Enter; links retain their names in icon-only mode. Hover/focus labels can be dismissed with Escape. Collapsed groups remain expanded so their destinations stay reachable.
- `Header`: banner with `search`, `notifications`, `userMenu`, and optional children slots. Pass accessible controls as slot content.
- `Breadcrumb`: labelled navigation and an ordered list; the final item is the current page. Decorative separators are hidden from assistive technology.
- `CommandPalette`: native modal dialog, Cmd/Ctrl+K, labelled combobox, grouped listbox, filtering, wrapping Up/Down, Home/End, Enter to run, Escape/close button, and focus restored to its trigger. The browser provides modal focus containment. Each action takes `id`, translated `label` and `group`, and `onSelect`.
- `Kbd`: semantic keyboard shortcut chip.

## Accessibility checklist (per component)

- [ ] Operable by keyboard alone; logical tab order; no keyboard traps
- [ ] Visible focus ring (`:focus-visible`, 2 px, 3:1 against its background)
- [ ] Name, role, state exposed (`aria-*` only where native semantics are insufficient)
- [ ] Text 4.5:1, large text and UI components 3:1; status never by colour alone
- [ ] Interactive targets at least 32 px (WCAG 2.2 target size minimum is 24 px)
- [ ] Respects `prefers-reduced-motion`
- [ ] Errors identified in text and programmatically associated with the field
- [ ] axe-core test (`test-utils.ts`, WCAG 2.0 to 2.2 AA tags) in the component test; colour contrast is covered by the token tests because jsdom has no layout
- [ ] Manual screen reader and visual-regression pass (not automated yet)

## Tests

`pnpm --filter @talentstroom/ui test` (vitest, jsdom, Testing Library, axe-core).

## Overlays and feedback

- `Tooltip`: wrap one focusable element (including an icon-only `Button` with `aria-label`), pass translated `content`. Opens after `delay` (300 ms), preserves existing descriptions, dismisses on Escape/blur, and stays hoverable. Essential information must also exist in the page.
- `HoverCard`: the same single-element trigger pattern for a link with a supplementary rich `content` preview. Focus/hover keeps it open; Escape dismisses it. Use `Popover` for task controls.
- `Popover`: pass a button as `trigger`, a translated `label`, and interactive children. Uses the native Popover API when available, viewport positioning and a non-modal fallback otherwise. Focus enters the content; Escape, outside click and the trigger close it.
- `Dialog` / `Sheet`: `title`, `triggerLabel`, `closeLabel`; native `showModal()` supplies focus containment and Escape cancellation. `children` and `footer` can be render functions receiving `close`. Dialog sizes: `sm`/`md`/`lg`; sheet sides: `right`/`left`. Closing restores trigger focus.
- `AlertDialog`: `title`, `triggerLabel`, `cancelLabel`, `confirmLabel`, `onConfirm`; starts on Cancel. Only the explicit confirmation invokes `onConfirm`.
- `Toaster`: wrap the notification-producing subtree with translated `label` and `closeLabel`. `useToast()` exposes `toast({ message, tone, duration })` and `dismiss(id)`. The queue shows at most `maxVisible` (default 3); queued timers start when visible. `Toast` can also be rendered directly. Status roles announce politely; danger announces as an alert. Timers pause independently on hover and focus; `duration: 0` persists until dismissed.
- `AlertBanner`: persistent text and icon in `info`/`success`/`warning`/`danger`, optional `action`, and `onDismiss` with `dismissLabel`.
- `Skeleton`: decorative `text`/`avatar`/`card`/`rows` shapes with configurable `lines`. The caller marks the containing content region `aria-busy` while loading. Shimmer and overlay motion respect reduced motion.

Tests cover component semantics, axe checks, keyboard focus restoration, explicit destructive confirmation, preview persistence, toast pause/resume and queue promotion. Native browser modal trapping and visual layout still require a browser/manual accessibility pass.

## Metrics and data

- `StatCard`: numeric `value`, translated `label`, optional `formatOptions` (for example EUR currency), `icon`, `trend`, `description` and `badge`. Numbers default to `Intl.NumberFormat("nl-NL")`; the label, value, trend and description form one screen-reader text.
- `TrendIndicator`: percentage `value` (12.5 displays as +12,5%), translated `comparisonLabel`, `upIsGood` (default true), optional `locale`. Signed text and directional icons accompany the semantic tone.
- `Progress`: translated `label`, optional numeric `value`, `min`/`max`, `formatValue`, and neutral/info/success/warning/danger `tone`. Omitting `value` makes it indeterminate and omits `aria-valuenow`; animation stops with reduced motion.
- `LineChart` / `BarChart`: translated `label`, `tableLabel`, `categories` and `series: { id, label, values, paletteIndex? }[]`. Values align with categories; missing values are zero. `LineChart` supports `area`; `BarChart` supports `horizontal` and nonnegative counts. Set `paletteIndex` to preserve a series colour/dash identity when filtering. `DonutChart` takes nonnegative `data: { id, label, value }[]`; zero totals render an empty ring. Supply descriptive chart names, short category labels, and small series sets suited to a compact report.
- Every chart has a responsive SVG image, focusable marks with hover/focus tooltips (Escape dismisses), and an expandable semantic data table. Lines use dash patterns, bars use patterns and direct values, and donut slices use numbered labels. The palette uses existing semantic tokens tested in both themes. `ChartLegend` takes `items`, controlled `visibleIds` and `onChange`; pressed buttons toggle visibility. Pass the filtered data to both chart and table through the chart's props.
- `DataTable<Row>`: `caption`, `columns: { id, label, cell, sortValue? }[]`, `rows`, `rowKey`, `emptyLabel`, `loadingLabel`. Sorting uses numeric comparison or Dutch locale collation. Sorting applies to the rows supplied; controlled `sort`/`onSortChange` support ordering the complete result before pagination (as shown in the gallery) or requesting server-sorted pages. Optional controlled selection uses `selectedIds`, `onSelectionChange`, `selectAllLabel`, `selectRowLabel` and `rowLabel`. Selection of the visible page preserves other selected IDs. The scroll region is focusable, headers stick, and `loading` renders decorative Skeleton rows inside an `aria-busy` region.
- `Pagination`: controlled one-based `page`, `total`, `pageSize`, `onPageChange`, `onPageSizeChange`, optional `pageSizes`. Pass translated navigation labels and `pageLabel`. Reset page after changing page size or filters. Current page uses `aria-current`; controls remain bounded for large totals.
- `ActivityFeed`: translated region `label`, `items: { id, actor, action, date, avatar? }[]`, optional `locale` (default Dutch) and `now` for deterministic previews. Events sort newest first, with ISO `time` attributes, localized full dates and relative times refreshed each minute. `Avatar` uses `name`, optional `src`, and `size` sm/md/lg; failed images fall back to initials with the full accessible name.

## Filtering

- `SearchInput`: translated `label`/`clearLabel`, controlled `value`/`onChange` or `defaultValue`, and debounced `onSearch` (`debounceMs`, default 300). `searchLandmark` enables a named search region. Clearing restores input focus; unmount cancels pending callbacks.
- `Combobox`: translated `label`, `emptyLabel`, `removeLabel`, `options: { value, label, disabled? }[]`, controlled `value: string[]` and `onChange`. Single selection is the default; `multiple` adds removable chips. DOM focus remains on the editable input while `aria-activedescendant` tracks enabled choices. Up/Down wrap, Home/End reach the ends, Enter selects, Escape cancels search, and Tab closes. Disabled choices are skipped. Option values must be unique.
- `FacetedFilter`: controlled `value`/`onChange`, translated `label`, `searchLabel`, `clearLabel`, `emptyLabel`, `options: { value, label, count }[]`. The trigger announces the selected count. The Popover reuses SearchInput and Checkbox; filtering never clears hidden selections.
- `DateRangePicker`: controlled optional `value: { start: Date, end?: Date }`, `onChange`, translated `label` and `labels` (previous/next/today/last7/month/hint/start/complete), optional `locale`, `today`, `disabled`. Use local calendar dates. First activation starts a new range; the second orders the endpoints, closes and restores focus. The Monday-first grid supports arrows, Home/End, PageUp/PageDown and Shift+PageUp/PageDown for years, clamping month ends. Presets choose inclusive today/last seven days/current month ranges. The trigger exposes the formatted selection; month changes and selection instructions are announced. Popover's optional `initialFocus` selector allows calendar entry on its selected day.
- `ViewSwitcher`: translated `label`, `options: { value, label, icon?, disabled? }[]`, controlled `value`/`onChange`. Radio semantics, one tab stop, wrapping arrows, Home/End and disabled-option skipping. The app renders the corresponding view.

The `metrics`, `charts`, `tables` and `filters` gallery pages show these components with synthetic Dutch recruitment data and English translations. Use the existing header theme switch to inspect every example in light and dark. The tables demo combines filters, search, selection and pagination with table/card/Kanban views.

## Applying a theme

Import tokens before components once at the application entry point. Set `data-theme="light"` or `data-theme="dark"` on `document.documentElement` to force a theme; remove the attribute for system preference. Prefer `setThemePreference` / `ThemeToggle` to persist and synchronize that choice. Components inherit all colours from semantic CSS variables; do not override them with raw colours. Keep any new token synchronized in `tokens.css` and `tokens.ts`, define both themes and extend the contrast pairs in `tokens.test.ts`. No new tokens or runtime dependencies are needed by the data components.

Automated tests cover semantics, keyboard interactions, meaningful empty/loading/selection states and axe checks. jsdom cannot verify rendered contrast, native browser layout or assistive-technology interoperability; retain the manual visual and screen-reader pass in the accessibility checklist above.

## Brand

`src/brand/talentstroom-mark.svg` is the vector person/wave mark (hand-authored Bézier paths and linear gradients, redrawn from `docs/logo/*.png`; no raster data). `Logo` renders it inline with `variant` `mark | full`, `tone` `auto | light | dark`, `size` `sm | md | lg | xl`; the full variant sets "Talent" + "Stroom" as live Asap Sharp 700 text (the PNG lettering is a placeholder font and is not reused). It has the accessible name "TalentStroom"; pass `decorative` when visible text sits next to it. `Logo.test.tsx` keeps the component paths identical to the SVG file.

Favicons and app icons for `apps/web` and `apps/site` (`favicon.svg/.ico`, `apple-touch-icon.png`, `icon-192/512.png`, `site.webmanifest`) are generated with `pnpm --filter @talentstroom/ui brand-icons` (needs Node 22+ and `rsvg-convert`, `brew install librsvg`). Commit the output.

## Visual review

Run `pnpm visual:install` once, then `pnpm visual` from the repository root. Playwright
starts and stops its own Vite server on port **5178**; no API server is needed. Every page
in the gallery registry is captured automatically in light/dark at 1440×1000 and 390×844,
after text and icon fonts load. PNGs live at `artifacts/visual/<page>-<theme>-<width>.png`;
open `artifacts/visual/index.html` for the contact sheet. Artifacts are git-ignored.

For manual review use `/?gallery&theme=light#forms` or `theme=dark` on the dev server.
This dev-only override never writes localStorage. Review against `docs/images/redesign/`:
tokens and component specs win over mockup pixels, and WCAG 2.2 AA wins over the visual spec.

UI PRs receive a `visual` CI artifact (14-day retention); this job is not a required check.
There are no pixel assertions yet. Auth screenshots await the missing auth screen
implementation. See [the web README](../../apps/web/README.md) for scope and follow-ups.

## Design-kit form controls (#376)

The forms gallery (`/?gallery&theme=light#forms`, also `theme=dark`) presents each field in default, hover, focus, filled, error, disabled and readonly states, plus every button variant in default/hover/active/focus/disabled/loading. `data-state="hover"` and `data-state="focus"` wrappers preview the same styling as real pointer and keyboard states; these attributes do not simulate interaction or change ARIA state.

- Controls keep their original APIs. `Select` remains native; use `Combobox multiple` for searchable chips inside the boundary. `Combobox` adds `error` and `readOnly`; `DateRangePicker` adds `error` and `readOnly`. Readonly selection controls reject value changes while remaining available to keyboard users.
- `Textarea maxLength` shows a counter that also follows externally changed controlled values. `Slider` keeps native range keyboard semantics and renders a themed track, thumb, and value bubble; hints/errors join `aria-describedby`.
- `FileUploader` adds `dropLabel` (for “Sleep bestanden hierheen”), `acceptedTypesLabel` (localized accepted formats and limit), `disabled`, and `readOnly`. Supply the translated upload link through `chooseLabel`. Disabled/readonly controls reject file drops and removal.
- Radius is 10px; button sizes use 32/40/48px tokens. Subtle field fills keep the ≥3:1 strong border. Success/warning buttons use navy text; contrast and other deliberate deviations are recorded in ADR 0013. No new runtime dependency.

Last successful Chrome screenshot artifacts for issue #376: `/tmp/rd-forms-{light,dark}-{1440,390}.png` (full page) and `/tmp/rd-forms-{light,dark}-{1440,390}-viewport.png`. These captures precede the final focus-ring cleanup, shorter button label, disabled-zone annotation and calendar icon overlay. A final screenshot refresh was attempted but Chrome and Chromium exited during macOS app/Mach-port registration with permission denied. Owner review and a refreshed capture on an unrestricted host are still required. Browser inspection covers Chromium; Firefox/WebKit and assistive-technology review remain follow-ups. This change does not touch authentication, encryption, tenancy, or data storage.

### Cards and action menus (issue #378)

`Card` supports `default`, `kpi`, `data` (edge-to-edge body), and `widget` variants,
`subtitle`, `headerActions` (`actions` remains compatible), `selected`, and `loading`.
Loading replaces the body with a decorative Skeleton and marks the card busy.
Cards are structural containers; they do not become keyboard controls on hover.
Supply `menuItems` **and a translated `menuLabel`** (Dutch: “Meer acties”) to opt into
an action menu. Static panels have no implicit actions.

`ContextMenu` is also usable in `DataTable` cell renderers. Items have a stable `id`,
`label`, optional Icon name, `disabled`, optional `tone: "danger"`, and `onSelect`;
separators use `{ id, separator: true }`. Disabled items remain focusable for
keyboard discovery but cannot execute. Arrow keys wrap, Home/End jump, printable
keys search labels, and Escape/outside click close and return focus. Tab closes
and continues normal navigation. `onOpenChange` reports user changes;
`defaultOpen` supports interactive gallery examples.

Callers filter items using permissions, and the server must authorize every action.
A danger tone is presentation, not authorization or confirmation: its callback must
request a confirmation dialog before any destructive mutation. The metrics gallery
demonstrates cancellation and confirmation with synthetic widget data.

`StatCard` keeps localized number formatting and adds `tone` (primary, success,
violet, accent), a tinted Icon tile and `sparkline: { values, label }`. The label is
the SVG text alternative; the caller supplies a meaningful localized summary.
Non-finite or fewer than two samples omit the sparkline; constant series remain
flat. Trend chips retain signed values and direction independently of color.

`EmptyState` takes `title`, `body`, optional `icon` and `action`, and a variant of
`no-records`, `no-results`, or `error`. Only errors use `role="alert"`; icons and
copy distinguish the recovery paths. All copy comes from the caller's i18n keys.

The kit's tokens and ADR 0013 determine colors, 14 px radii and typography. Status
text uses the accessible `-text` colors rather than the lower contrast decorative
fills. No new design deviations or dependencies were introduced.

Visual review artifacts (Chrome, light/dark, desktop/mobile):

- `/tmp/rd-cards-metrics-light-1440.png`
- `/tmp/rd-cards-metrics-dark-1440.png`
- `/tmp/rd-cards-metrics-light-390.png`
- `/tmp/rd-cards-metrics-dark-390.png`
- `/tmp/rd-cards-feedback-light-1440.png`
- `/tmp/rd-cards-feedback-dark-1440.png`
- `/tmp/rd-cards-feedback-light-390.png`
- `/tmp/rd-cards-feedback-dark-390.png`

Owner visual approval remains a review step. Browser interaction and screenshots
were checked in Chrome; Firefox and WebKit review remains follow-up work.
