# Badge

**Bestanden:** `src/components/Badge/Badge.tsx`, `src/components/Badge/Badge.test.tsx`, `src/components/Badge/Badge.css`.

**Afbeeldingen:** `images/components/selections_badges_light_3200x2000.png` en `_dark_3200x2000.png` (gedeelde visual sheet); SVG-bronnen `assets/vector/selections_badges_light.svg` / `_dark.svg`.

## Varianten
nieuw, in behandeling, gesprek, aanbod, geplaatst, afgewezen

## States
`default`, `subtle`, `solid`. Definieer daarnaast `:focus-visible` en keyboard gedrag expliciet.

## Public API / props
`tone`, `children`, `icon`. Behoud React semantiek en typ de props exact in TypeScript.

## Tailwind CSS v4
Gebruik `@theme inline`-tokens uit `tokens/tailwind-theme.css`, utilities voor layout en thema's; `Badge.css` uitsluitend voor component-specifieke styling, data attributes en browserdetails. Geen hardcoded kleurwaarden in component-code.

## Iconen
Material Symbols Rounded; details in `docs/foundations/04-icons.md`. Alle icon-only actions hebben een toegankelijk label.

## Tests (Vitest + Testing Library)
Kleur niet als enige informatiebron. Test ook disabled state, focus en lichte/donkere themavarianten via relevant classes/data attributes. Geef acties geen side effects zonder bevestiging.

## Acceptatie
Functioneel, responsief en keyboard-toegankelijk in Chromium/Firefox/WebKit; visueel toetsen aan de design tokens, niet blind aan AI-mockup-pixels.
