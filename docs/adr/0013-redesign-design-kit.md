# 0013 — Applying the redesign design kit

- **Status:** Accepted (approved by merging PR)
- **Date:** 2026-10-29
- **Resolves:** —
- **Issue:** #375 (epic #369, see also #372)

## Context

`docs/images/redesign/` holds the TalentStroom design kit v1.0: foundations (colours, typography, spacing, icons, accessibility), component specs, JSON/CSS tokens and raster/SVG previews. The kit assumes React with Tailwind CSS v4 (`@theme inline`), one folder per component and Material Symbols Rounded. Our design system (`packages/ui`) is plain CSS on `--ts-*` custom properties with flat component files, mirrored in `tokens.ts` and guarded by a token-sync and contrast test. Several kit colours fail WCAG 2.2 AA for the way the boards use them.

## Options considered

1. **Adopt the kit literally (Tailwind v4, folder per component, kit variable names)** — closest to the handoff, but adds a build dependency and rewrites every component and test for no user-facing gain; ADR 0002 and the UI package README already chose plain CSS.
2. **Map the kit onto our existing token system** — keeps the toolchain, the sync/contrast tests and component structure; needs an explicit mapping and a record of deviations.

## Decision

Option 2.

- **Styling:** plain CSS on our `--ts-*` variables (`packages/ui/src/tokens.css`, mirrored by `tokens.ts`). No Tailwind. Kit utility names (`bg-canvas`, `text-ink`, …) translate to the variables in the mapping table below.
- **Files:** our flat convention stays (`components/Button.tsx`, `Button.test.tsx`, `Button.css`) instead of a folder per component.
- **Icons:** Material Symbols **Rounded**, self-hosted (handled in `fonts.css` / `Icon`).
- **Brand:** the person/wave logo from the kit is the final brand mark.
- **Precedence:** tokens and written specs win over mockups (the kit itself says so in `MOCKUP-DEVIATIONS.md`); WCAG 2.2 AA wins over the visual spec. Where a kit colour fails for text it stays available for fills/icons, and a passing `-text` variant is added.
- **Themes:** light and dark are both first-class; `data-theme` on the root, `system` follows `prefers-color-scheme` (unchanged).
- **Contrast:** `tokens.test.ts` checks every text/surface, text/fill, status label, sidebar, UI-boundary and focus pair in both themes; documented deviations have their own assertions.

### Mapping: kit token → our token

| Kit (`colors.json` / Tailwind)               | Light / dark kit value  | Our token                                                                                          | Our light / dark value                                          |
| -------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `background` / `canvas`                      | `#F5F7FB` / `#081727`   | `--ts-bg`                                                                                          | same                                                            |
| `surface` / `panel`                          | `#FFFFFF` / `#10243B`   | `--ts-surface`                                                                                     | same                                                            |
| `surface-subtle` / `panel-muted`             | `#EDF2F9` / `#183049`   | `--ts-surface-muted`                                                                               | same                                                            |
| (dark surface elevation)                     | —                       | `--ts-surface-raised` (popovers, dialogs)                                                          | `#FFFFFF` / `#183049`                                           |
| `text` / `ink`                               | `#102038` / `#F3F7FC`   | `--ts-text`                                                                                        | same                                                            |
| `text-muted` / `ink-muted`                   | `#61718A` / `#A2B5CA`   | `--ts-text-muted`                                                                                  | **`#5B6B83`** / same                                            |
| `border` / `line`                            | `#D8E2EF` / `#30475D`   | `--ts-border` (decorative)                                                                         | same                                                            |
| (input boundary)                             | —                       | `--ts-border-strong`                                                                               | `#7A8BA3` / `#7B90A8`                                           |
| `primary` / `brand`                          | `#245BF4` / `#4E82FF`   | `--ts-primary` (fill), `--ts-primary-text` (links, ghost buttons)                                  | `#245BF4` / **`#3369F0`**; text `#245BF4` / `#82AEFF`           |
| `primary-foreground` / `brand-contrast`      | `#FFFFFF`               | `--ts-text-on-primary`                                                                             | `#FFFFFF`                                                       |
| `focus`                                      | `#245BF4` / `#82AEFF`   | `--ts-focus-ring-color`                                                                            | same; `--ts-focus-ring-color-on-dark` `#82AEFF` for the sidebar |
| `success` / `positive`                       | `#22BE9C` / `#43DDB6`   | `--ts-success` (+ `-subtle`, `-text`)                                                              | same; text **`#0B7259`** / `#43DDB6`                            |
| `warning` / `caution`                        | `#EBA43E` / `#FFBB5A`   | `--ts-warning` (+ `-subtle`, `-text`)                                                              | same; text **`#8F5408`** / `#FFBB5A`                            |
| `danger` / `negative`                        | `#DB3348` / `#FF6575`   | `--ts-danger` (fill), `--ts-danger-text`                                                           | `#DB3348` / **`#DB3348`**; text **`#B4233A`** / `#FF6575`       |
| status "Gesprek" (SVG boards)                | `#9772FF`               | `--ts-violet` (+ `-subtle`, `-text`)                                                               | `#9772FF`; text `#5B37CC` / `#C3B1FF`                           |
| accent mint/teal (foundation concept)        | raster only             | `--ts-accent` (+ `-subtle`, `-text`), `--ts-accent-{50…700}`                                       | `#2CD3C0` / `#5DDDC1`                                           |
| primary 50…900 (foundation concept)          | raster only             | `--ts-primary-{50…900}`                                                                            | 500 = `#245BF4`, 400 = `#4E82FF`                                |
| neutrals (foundation concept)                | raster only             | `--ts-neutral-{0…900}`                                                                             | 50/100/200/600/900 = kit canvas/subtle/line/muted/ink           |
| navy sidebar (design-kit screens)            | raster only             | `--ts-sidebar-*`, `--ts-navy-*`                                                                    | bg `#0A1829`, active `#1B3FA0`, text `#C5D1E0`                  |
| `fontSizePx` xs…4xl                          | 12/14/16/18/20/24/30/36 | `--ts-font-size-{xs,sm,md,lg,xl,2xl,3xl,4xl}`                                                      | same (`base` → `md`)                                            |
| type roles (hero…label)                      | 36/44 … 14/20 600       | `--ts-font-{hero,page-title,section-title,card-title,body,compact,caption,label}` (font shorthand) | same                                                            |
| `spacingPx` 2…80                             | 2,4,…,64,80             | `--ts-space-{0-5,1,2,3,4,5,6,8,10,12,16,20}`                                                       | same                                                            |
| `radiusPx` sm/md/lg/xl/full, `--radius-card` | 6/10/14/20/9999         | `--ts-radius-{sm,md,lg,xl,full}`                                                                   | same (cards `lg`, inputs/buttons `md`, modals `xl`)             |
| `borderPx` default/focus                     | 1 / 2                   | `--ts-border-width`, `--ts-focus-ring-width` (+ `-offset` 2px)                                     | same                                                            |
| shadows (03-spacing-borders)                 | card / popover          | `--ts-shadow-{card,popover,modal}`                                                                 | light as kit; dark minimal (`rgb(0 0 0 / …)`) plus borders      |
| `breakpointsPx`                              | 390/768/1024/1440       | `--ts-breakpoint-{mobile,tablet,desktop,wide}`, `breakpoints`                                      | same (reference values; media queries use literals)             |
| layout (sidebar, navbar, content)            | 252/68, 64, 1600        | `--ts-sidebar-width(-collapsed)`, `--ts-navbar-height`, `--ts-content-max-width`                   | same                                                            |

Renamed in this change (all usages updated): `--ts-shadow-sm/md/lg` → `--ts-shadow-card/popover/modal`; `--ts-mint` → `--ts-accent`; unused `--ts-sidebar` removed. `--ts-font-size-lg/xl/2xl` now follow the kit scale (18/20/24 instead of 20/24/32).

### Accessibility deviations from the kit

| Kit                                                               | Problem (WCAG 2.2 AA)                                            | Our choice                                                                                                    |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Light `text-muted` `#61718A`                                      | 4.41:1 on `surface-subtle` (1.4.3)                               | `#5B6B83` (4.82:1), also `--ts-neutral-600`                                                                   |
| Light `success` `#22BE9C`, `warning` `#EBA43E`, accent teal       | 2.4 / 2.1 / 1.9:1 on white: fail as text and UI (1.4.3, 1.4.11)  | Kept as decorative fills (progress, chart, dots next to text); text and meaningful icons use `--ts-*-text`    |
| Solid status badges with white text (SVG board "Badges / Status") | White on `#EBA43E` 2.1:1, on `#22BE9C` 2.4:1, on `#9772FF` 3.4:1 | Status labels use `-subtle` background + `-text` foreground (the design-kit screens already show this)        |
| Dark `primary` `#4E82FF` with white text                          | 3.52:1 (1.4.3)                                                   | Dark button fill `#3369F0` (4.75:1 with white); kit `#4E82FF` kept as `--ts-primary-400`; links use `#82AEFF` |
| Dark `primary` as text on `surface`                               | 4.46:1                                                           | `--ts-primary-text` `#82AEFF` (7.06:1)                                                                        |
| Dark `danger` `#FF6575` with white text                           | 2.85:1                                                           | Dark danger fill `#DB3348` (4.59:1 with white); `#FF6575` is `--ts-danger-text`                               |
| Light `danger` as text on its subtle background                   | below 4.5:1 on tinted backgrounds                                | `--ts-danger-text` `#B4233A`; invalid input border uses it too (also passes 3:1 on raised surfaces)           |
| Input boundary `#D8E2EF` on `#EDF2F9` fill                        | 1.3:1, component not identifiable (1.4.11)                       | Inputs keep the `--ts-border-strong` boundary (≥3:1 in both themes); `--ts-border` stays for dividers         |
| Sidebar section labels (raster)                                   | estimated below 4.5:1 on navy                                    | `--ts-sidebar-text-muted` `#8A9CB6` (6.39:1)                                                                  |

Disabled controls are exempt (1.4.3) and keep the kit's low-contrast look.

## Consequences

- No new dependency; components keep their structure. Visual parity with the kit becomes a matter of component restyles (#376 and later), which can rely on these tokens.
- Light status fills are decorative only; reviewers must not use `--ts-success`/`--ts-warning`/`--ts-accent` as text or the only carrier of meaning.
- The dark theme is slightly deeper blue on primary buttons than the kit renders.
- The gallery has a Tokens page (`?gallery#tokens`) with swatches, hex values and contrast ratios for both themes; `?gallery&theme=light|dark` forces a theme for screenshots without persisting it.

## Rollback

Tokens are values in two mirrored files; reverting this change restores the previous palette. Moving to Tailwind later would mean importing `tokens.css` variables into a `@theme inline` block, not redefining colours.
