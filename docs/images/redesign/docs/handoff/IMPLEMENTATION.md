# React + Tailwind CSS v4 — handoff

## Directory afspraak (verplicht)
```
src/components/Button/Button.tsx
src/components/Button/Button.test.tsx
src/components/Button/Button.css
```
Gebruik dezelfde conventie voor alle componenten; maak barrel exports alleen wanneer nuttig.

## Volgorde
1. `tokens/tailwind-theme.css` importeren in de globale stylesheet (geïnstalleerde fonts intact laten).
2. Primitive controls en tokens implementeren; test hover/focus/disabled/error.
3. App shell met persistente navigatie, theme en organization context.
4. Recruitment-schermen en client portal op primitives bouwen.
5. Axe / Playwright / unit tests + screenshot regressie.

## Design token handhaving
Tailwind CSS v4 ondersteunt CSS-first `@theme`. Gebruik `bg-canvas`, `bg-panel`, `text-ink`, `border-line`, `bg-brand`. Zorg dat de theme wissel via `[data-theme="dark"]` op document-root loopt. Leg ook `system` vast, inclusief OS theme changes.

## Org switch & security
Wijzig active organization server-side. Clear tenant-scoped caches, abort in-flight requests en invalideer org-specifieke frontend data. UI visibility is nooit autorisatie.

## Component interaction
Card header heeft optioneel `more_vert` menu, niet standaard op statische informatieve panels. Menu-acties worden dynamisch aangeboden op basis van rechten, en backend valideert opnieuw. Destructieve acties vereisen dialoog.

## Teststandaard
Vitest + Testing Library voor componenten, Playwright voor browserflown; Storybook of vergelijkbare preview optioneel. Test kleurcontrast, RWD, keyboard, 200% zoom en 2× DPR snapshots. Geen snapshot zonder relevante gedragsassertions.
