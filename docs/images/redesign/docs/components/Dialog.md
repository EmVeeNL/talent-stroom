# Dialog

**Bestanden:** `src/components/Dialog/Dialog.tsx`, `src/components/Dialog/Dialog.test.tsx`, `src/components/Dialog/Dialog.css`.

**Afbeeldingen:** `images/components/overlays_feedback_light_3200x2000.png` en `_dark_3200x2000.png` (gedeelde visual sheet); SVG-bronnen `assets/vector/overlays_feedback_light.svg` / `_dark.svg`.

## Varianten
confirmation, destructive, informative

## States
`closed`, `open`, `submitting`, `error`. Definieer daarnaast `:focus-visible` en keyboard gedrag expliciet.

## Public API / props
`open`, `title`, `description`, `onClose`, `actions`. Behoud React semantiek en typ de props exact in TypeScript.

## Tailwind CSS v4
Gebruik `@theme inline`-tokens uit `tokens/tailwind-theme.css`, utilities voor layout en thema's; `Dialog.css` uitsluitend voor component-specifieke styling, data attributes en browserdetails. Geen hardcoded kleurwaarden in component-code.

## Iconen
Material Symbols Rounded; details in `docs/foundations/04-icons.md`. Alle icon-only actions hebben een toegankelijk label.

## Tests (Vitest + Testing Library)
Modal focus management, Esc policy, confirm flow. Test ook disabled state, focus en lichte/donkere themavarianten via relevant classes/data attributes. Geef acties geen side effects zonder bevestiging.

## Acceptatie
Functioneel, responsief en keyboard-toegankelijk in Chromium/Firefox/WebKit; visueel toetsen aan de design tokens, niet blind aan AI-mockup-pixels.
