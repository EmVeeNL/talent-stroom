# Switch

**Bestanden:** `src/components/Switch/Switch.tsx`, `src/components/Switch/Switch.test.tsx`, `src/components/Switch/Switch.css`.

**Afbeeldingen:** `images/components/selections_badges_light_3200x2000.png` en `_dark_3200x2000.png` (gedeelde visual sheet); SVG-bronnen `assets/vector/selections_badges_light.svg` / `_dark.svg`.

## Varianten
on/off

## States
`hover`, `focus`, `checked`, `disabled`. Definieer daarnaast `:focus-visible` en keyboard gedrag expliciet.

## Public API / props
`checked`, `onCheckedChange`, `label`. Behoud React semantiek en typ de props exact in TypeScript.

## Tailwind CSS v4
Gebruik `@theme inline`-tokens uit `tokens/tailwind-theme.css`, utilities voor layout en thema's; `Switch.css` uitsluitend voor component-specifieke styling, data attributes en browserdetails. Geen hardcoded kleurwaarden in component-code.

## Iconen
Material Symbols Rounded; details in `docs/foundations/04-icons.md`. Alle icon-only actions hebben een toegankelijk label.

## Tests (Vitest + Testing Library)
Role switch en aria-checked. Test ook disabled state, focus en lichte/donkere themavarianten via relevant classes/data attributes. Geef acties geen side effects zonder bevestiging.

## Acceptatie
Functioneel, responsief en keyboard-toegankelijk in Chromium/Firefox/WebKit; visueel toetsen aan de design tokens, niet blind aan AI-mockup-pixels.
