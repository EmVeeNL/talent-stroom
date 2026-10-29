# ContextMenu

**Bestanden:** `src/components/ContextMenu/ContextMenu.tsx`, `src/components/ContextMenu/ContextMenu.test.tsx`, `src/components/ContextMenu/ContextMenu.css`.

**Afbeeldingen:** `images/components/cards_tables_menus_light_3200x2000.png` en `_dark_3200x2000.png` (gedeelde visual sheet); SVG-bronnen `assets/vector/cards_tables_menus_light.svg` / `_dark.svg`.

## Varianten
card header and row menu

## States
`closed`, `open`, `disabled`, `danger`. Definieer daarnaast `:focus-visible` en keyboard gedrag expliciet.

## Public API / props
`triggerLabel`, `items`, `onOpenChange`. Behoud React semantiek en typ de props exact in TypeScript.

## Tailwind CSS v4
Gebruik `@theme inline`-tokens uit `tokens/tailwind-theme.css`, utilities voor layout en thema's; `ContextMenu.css` uitsluitend voor component-specifieke styling, data attributes en browserdetails. Geen hardcoded kleurwaarden in component-code.

## Iconen
Material Symbols Rounded; details in `docs/foundations/04-icons.md`. Alle icon-only actions hebben een toegankelijk label.

## Tests (Vitest + Testing Library)
Esc/outside close, focus return, permission validation. Test ook disabled state, focus en lichte/donkere themavarianten via relevant classes/data attributes. Geef acties geen side effects zonder bevestiging.

## Acceptatie
Functioneel, responsief en keyboard-toegankelijk in Chromium/Firefox/WebKit; visueel toetsen aan de design tokens, niet blind aan AI-mockup-pixels.
