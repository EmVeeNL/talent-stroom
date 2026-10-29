# Button

**Bestanden:** `src/components/Button/Button.tsx`, `src/components/Button/Button.test.tsx`, `src/components/Button/Button.css`.

**Afbeeldingen:** `images/components/buttons_inputs_light_3200x2000.png` en `_dark_3200x2000.png` (gedeelde visual sheet); SVG-bronnen `assets/vector/buttons_inputs_light.svg` / `_dark.svg`.

## Varianten
`primary`, `secondary`, `outline`, `danger`, `ghost`; `sm`, `md`, `lg`

## States
`default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`. Definieer daarnaast `:focus-visible` en keyboard gedrag expliciet.

## Public API / props
`button`, `type`, `disabled`, `loading`, `leadingIcon`, `children`. Behoud React semantiek en typ de props exact in TypeScript.

## Tailwind CSS v4
Gebruik `@theme inline`-tokens uit `tokens/tailwind-theme.css`, utilities voor layout en thema's; `Button.css` uitsluitend voor component-specifieke styling, data attributes en browserdetails. Geen hardcoded kleurwaarden in component-code.

## Iconen
Material Symbols Rounded; details in `docs/foundations/04-icons.md`. Alle icon-only actions hebben een toegankelijk label.

## Tests (Vitest + Testing Library)
Klikken, enter/space, disabled blokkeert callback, loading voorkomt dubbele submit. Test ook disabled state, focus en lichte/donkere themavarianten via relevant classes/data attributes. Geef acties geen side effects zonder bevestiging.

## Acceptatie
Functioneel, responsief en keyboard-toegankelijk in Chromium/Firefox/WebKit; visueel toetsen aan de design tokens, niet blind aan AI-mockup-pixels.
