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

- Typography: `--ts-font-size-{xs,sm,md,lg,xl,2xl}` = 12/14/16/20/24/32 px, body line-height 1.5, heading 1.25, weights 400/500/600/700. Font: Asap Sharp (files and `@font-face` are handled separately in `fonts.css`).
- Spacing: `--ts-space-{1,2,3,4,5,6,8,10,12,16}` on a 4 px base.
- Radius, shadows (`--ts-shadow-{sm,md,lg}`), focus ring (`--ts-focus-ring-*`), motion durations.
- Semantic colours: text, muted, border, surface, background, primary, success/warning/danger/info, each with a `-subtle` background and a `-text` colour for status pills.
- Dark sidebar palette: `--ts-sidebar-*`.

### Changes versus `docs/images/tokens/design-tokens.json` (WCAG 2.2 AA)

| Token             | Source                             | Now                                                 | Why                                                                         |
| ----------------- | ---------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| `--ts-text-muted` | `#68748A`                          | `#5B677D`                                           | 4.40:1 on page background `#F5F7FB`; now 5.32:1                             |
| warning as text   | `#BD7B20` (3.49:1 on white)        | `--ts-warning-text` `#8A5410` (5.68:1 on `#FCF3E3`) | Source warning only passes as a UI colour (3:1); text uses the darker shade |
| success as text   | `#158365` (4.21:1 on subtle green) | `--ts-success-text` `#0F6B52` (5.80:1)              | Pills on subtle background                                                  |
| danger on subtle  | `#C63E55`                          | `--ts-danger-text` `#A82F45` (5.78:1)               | Pills, error messages                                                       |
| input border      | `#E5E9F1` (decorative)             | `--ts-border-strong` `#7C879B` (3.62:1)             | Input boundaries are UI components (3:1)                                    |

Unchanged brand colours: primary `#4F59F7` (5.12:1 with white text), primary hover, mint, danger/success/warning solids (used as fills and icons, 3:1 or better), sidebar `#111827`. Disabled controls are exempt from contrast requirements. `contrast.ts` plus `tokens.test.ts` assert every text/background pair (4.5:1) and UI/focus pair (3:1).

## Component index

| Category               | Components                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations and layout | `Logo`, `Icon`, `Kbd`, `Card`, `Sidebar`, `Header`, `Breadcrumb`, `ThemeToggle`                                                              |
| Actions and navigation | `Button`, `Tabs`, `CommandPalette`                                                                                                           |
| Forms                  | `FormField`, `TextField`, `Textarea`, `NumberInput`, `Select`, `Switch`, `Checkbox`, `CheckboxGroup`, `RadioGroup`, `Slider`, `FileUploader` |
| Metrics and status     | `StatCard`, `TrendIndicator`, `Progress`, `Badge`, `StatusPill`                                                                              |
| Data visualisation     | `LineChart`, `BarChart`, `DonutChart`, `ChartLegend`                                                                                         |
| Tables and lists       | `DataTable`, `Pagination`, `ActivityFeed`, `Avatar`                                                                                          |
| Filtering and controls | `SearchInput`, `Combobox`, `DateRangePicker`, `FacetedFilter`, `ViewSwitcher`                                                                |
| Overlays and feedback  | `Tooltip`, `HoverCard`, `Popover`, `Dialog`, `Sheet`, `AlertDialog`, `Toast`, `Toaster`, `AlertBanner`, `Skeleton`                           |

## Components

| Component             | Notes                                                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`              | `variant` primary/secondary/ghost/danger, `size` sm/md/lg, `icon`, `loading` (+ `loadingLabel`). Loading sets `aria-busy`/`aria-disabled`, ignores clicks, keeps focus. `type` defaults to `button`. |
| `TextField`           | `label`, `hint`, `error`, `required`. Label via `htmlFor`; hint and error joined in `aria-describedby`; `aria-invalid` and `role="alert"` on error.                                                  |
| `Badge`, `StatusPill` | Tones neutral/success/warning/danger/info. `StatusPill` adds a per-tone icon so status is not colour-only.                                                                                           |
| `Card`                | `as` div/section/article, optional `title` (heading level configurable) and `actions`; titled section/article is labelled by its heading.                                                            |
| `Tabs`                | WAI-ARIA tabs (automatic activation): roving tabindex, Left/Right (wrapping), Home/End, disabled tabs skipped, panels focusable. Controlled or uncontrolled.                                         |
| `Icon`                | Typed Material Symbols Rounded ligature (16/20/24/32px; default 20px); `aria-hidden` by default, `label` gives `role="img"` + `aria-label`.                                                          |

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
