# TalentStroom — Design System & UI Handoff v1.0

**Doel:** visual-first referentiepakket voor een private React + Tailwind CSS v4-applicatie, met Asap Sharp en Material Symbols (reeds geïnstalleerd).

## Inhoud
- `docs/foundations/`: kleuren, typografie, spacing, borders, iconen, dark mode, accessibility.
- `docs/components/`: herbruikbare React-componenten met `.tsx`, `.test.tsx`, `.css` conventie.
- `docs/screens/`: scherminventaris en app-shell.
- `docs/handoff/`: implementatie, verschillen en QA.
- `tokens/`: concrete CSS/JSON design-tokens.
- `images/components/`: 8 nieuw op SVG gebaseerde componentplaten, native 3200 × 2000 PNG, plus SVG-bronnen onder `assets/vector/`.
- `images/screens/`: 13 referentiebeelden op 2× exportafmeting, waaronder eerdere mockups.
- `assets/brand/`: bestaande TalentStroom-logo's (PNG).

## Betrouwbaarheid van afbeeldingen
De 8 componentplaten zijn *vector-first* gemaakt en op 2× gerasterd: tekst en lijnen blijven op exportresolutie scherp. De 13 schermbeelden zijn eerder gemaakte rastermockups, 2× met Lanczos opgeschaald; dit levert grotere bestanden maar **geen nieuwe detailinformatie**. Ze kunnen AI-tekstfouten en afwijkende componenten bevatten. Voor productie gelden de documentatie en tokens, nooit automatisch uit plaatjes afgeleide CSS.

## Belangrijk
- Font-binaries ontbreken bewust; gebruik reeds geïnstalleerde Asap Sharp en Material Symbols.
- Alle componentnamen en iconnamen zijn gespecificeerd in Markdown.
- De visuele referenties zijn géén echte React-interacties of functionele UI.
- Geen bestaande mockup is pixel-perfect bron van waarheid; zie `docs/handoff/MOCKUP-DEVIATIONS.md`.
