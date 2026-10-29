# Kleuren & thema's

Bron: `tokens/colors.json` en `tokens/tailwind-theme.css`. Alle componenten gebruiken **semantische** variabelen, nooit hardcoded `blue-600` in een component.

| Token | Light | Dark | Gebruik |
|---|---|---|---|
| background | #F5F7FB | #081727 | viewport |
| surface | #FFFFFF | #10243B | cards / menu |
| surface-subtle | #EDF2F9 | #183049 | inputs / stripes |
| text | #102038 | #F3F7FC | primaire tekst |
| text-muted | #61718A | #A2B5CA | secundaire tekst |
| border | #D8E2EF | #30475D | scheidingen |
| primary | #245BF4 | #4E82FF | primaire actie |
| success | #22BE9C | #43DDB6 | positieve status |
| warning | #EBA43E | #FFBB5A | waarschuwing |
| danger | #DB3348 | #FF6575 | fout / destructief |

**Regels:** tekstcontrast WCAG 2.2 AA controleren per concrete combinatie; status nooit alleen met kleur tonen; focus-ring zichtbaar op beide thema's; user-preference `system | light | dark` bewaren per gebruiker en SSR flash voorkomen; dark mode geen omgekeerde kleurenfilter.
