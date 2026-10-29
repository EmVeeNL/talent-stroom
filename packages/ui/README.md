# @talentstroom/ui

Design tokens and core React components. Plain CSS, no CSS-in-JS runtime, no Tailwind.

```ts
import "@talentstroom/ui/tokens.css";
import "@talentstroom/ui/components.css";
import { Button, TextField, Tabs } from "@talentstroom/ui";
```

Components take already-translated strings; user-facing copy goes through `@talentstroom/i18n` in the app. Dev showcase: run `pnpm dev` and open `http://localhost:5173/?gallery`.

## Tokens

`src/tokens.css` (CSS custom properties) and `src/tokens.ts` (`cssVariables` plus grouped views) are kept identical; `tokens.test.ts` fails when they drift.

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

## Components

| Component             | Notes                                                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`              | `variant` primary/secondary/ghost/danger, `size` sm/md/lg, `icon`, `loading` (+ `loadingLabel`). Loading sets `aria-busy`/`aria-disabled`, ignores clicks, keeps focus. `type` defaults to `button`. |
| `TextField`           | `label`, `hint`, `error`, `required`. Label via `htmlFor`; hint and error joined in `aria-describedby`; `aria-invalid` and `role="alert"` on error.                                                  |
| `Badge`, `StatusPill` | Tones neutral/success/warning/danger/info. `StatusPill` adds a per-tone icon so status is not colour-only.                                                                                           |
| `Card`                | `as` div/section/article, optional `title` (heading level configurable) and `actions`; titled section/article is labelled by its heading.                                                            |
| `Tabs`                | WAI-ARIA tabs (automatic activation): roving tabindex, Left/Right (wrapping), Home/End, disabled tabs skipped, panels focusable. Controlled or uncontrolled.                                         |
| `Icon`                | Material Symbols Outlined ligature; `aria-hidden` by default, `label` gives `role="img"` + `aria-label`.                                                                                             |

The Material Symbols font itself must be loaded by the app (self-host; see `docs/images/implementation/material-symbols.md`).

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
