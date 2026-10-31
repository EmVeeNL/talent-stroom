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

## Gedeeld formulier- en detailpatroon (#459)

Importeer `FormDialog` en `DetailDrawer` uitsluitend via `@talentstroom/ui`.
De bestaande `Dialog`- en `Sheet`-API blijft beschikbaar; `onBeforeClose` en
`initialFocus="form" | "heading"` zijn optionele uitbreidingen.

`FormDialog` beheert de modal, initiële veldfocus, footer en bevestiging bij
niet-opgeslagen wijzigingen. De eigenaar beheert TanStack Form en de Zod-schema's:

```tsx
<form.Subscribe selector={(state) => [state.isDirty, state.isSubmitting] as const}>
  {([dirty, submitting]) => (
    <FormDialog
      title={t(locale, "patterns.edit")}
      triggerLabel={t(locale, "patterns.edit")}
      closeLabel={t(locale, "patterns.close")}
      open={editing}
      hideTrigger
      onOpenChange={setEditing}
      dirty={dirty}
      submitting={submitting}
      labels={labels}
      formId={formId}
    >
      {/* form id={formId}, schema-validatie, FormSummary en AppField-velden */}
    </FormDialog>
  )}
</form.Subscribe>
```

Alle zes `labels` komen uit de catalogus: `cancel`, `save`, `discardTitle`,
`discardBody`, `keepEditing`, `discard`. Escape, de sluitknop en Annuleren
volgen dezelfde dirty-state-bevestiging. De veilige actie krijgt focus;
Escape in de bevestiging hervat het formulier. Tijdens opslaan blokkeren de
footer en sluitacties. Sluiten na succesvol opslaan is een expliciete wijziging
van `open` door de eigenaar en vraagt geen bevestiging. Zonder `labels` of
`formId` kan een bestaande feature zijn eigen formulierfooter behouden.

`DetailDrawer` gebruikt de native Sheet-modal en focust de titel. Optioneel:
`tabs` accepteert `TabsProps` (pijltjestoetsen/Home/End), `actions` voegt acties
toe, en `onEdit` met `editLabel` opent het formulier van de eigenaar. Behoud de
selectie tijdens bewerken; een formulier boven de drawer keert na sluiten terug
naar de editknop. `footer` blijft beschikbaar voor bestaande feature-acties; `footer={null}`
onderdrukt de standaardfooter als de feature zijn eigen acties bevat.
Native dialogs verzorgen focusbegrenzing; de bestaande reduced-motion-regels
voor Dialog, Sheet en Tabs blijven gelden.

De demo's CRM (bedrijfsnaam, contactnaam en dealtitel), Contacten (naam, functie,
bedrijf en plaats), Kanban (naam, functie en notitie) en Notities gebruiken
`RecordFormDialog` voor schema-gevalideerde edits. Wijzigingen blijven alleen
in componentgeheugen. Agenda gebruikt dezelfde shells met zijn bestaande
formulieren, acties, validatie en annuleren/verplaatsen-gedrag.

Gebruik de privacy-instellingen uit `apps/web/src/forms.tsx`: geen TanStack
Form-devtools of broadcasts van formulierwaarden. Render uitsluitend vertaalde,
toegestane foutcodes; geen ruwe schemafouten of ingevoerde waarden in meldingen,
logs, URL's of opslag. Nieuwe editors voegen geen netwerkverzoeken of opslag toe.

Verificatie: `FormDialog.test.tsx`, `form-pattern.test.tsx`, de bestaande
`Calendar.test.tsx` en `visual/form-pattern.visual.ts` (desktop en mobiel,
keyboard/focus, dirty-state, focusbegrenzing en reduced motion).
