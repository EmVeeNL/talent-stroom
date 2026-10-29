# Iconen — Material Symbols Rounded

**Enige standaardbibliotheek:** Google Material Symbols **Rounded** (reeds geïnstalleerd). Exacte ligature-namen hieronder; geen Lucide, Heroicons of emoji als applicatie-iconen.

| Context | Exacte iconnamen |
|---|---|
| navigation | `dashboard`, `person`, `work`, `assignment`, `handshake`, `groups`, `task_alt`, `calendar_month`, `bar_chart`, `settings`, `menu`, `menu_open` |
| actions | `add`, `more_horiz`, `more_vert`, `edit`, `delete`, `content_copy`, `refresh`, `download`, `upload_file`, `filter_list`, `sort`, `close`, `search`, `chevron_down`, `chevron_right`, `arrow_back`, `open_in_full` |
| security | `lock`, `lock_open`, `key`, `shield`, `verified_user`, `visibility`, `visibility_off`, `passkey`, `fingerprint` |
| feedback | `check_circle`, `error`, `warning`, `info`, `notifications`, `notifications_active`, `help` |
| theme | `dark_mode`, `light_mode`, `language` |
| recruitment | `person_search`, `description`, `work_history`, `business`, `group_add`, `send`, `translate`, `auto_awesome` |

## Implementatie
`<span className="material-symbols-rounded" aria-hidden="true">more_vert</span>`; icon-only button met `aria-label="Meer acties"`. Size 16px kleine inline iconen, 20px standaard, 24px navigation, 32px illustratief. Gebruik `font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 20`. Filled state mag `FILL 1` gebruiken voor geselecteerde items. Validate exacte glyph presence in geïnstalleerde fontversie.

| UI-plek | Icon | Interactie |
|---|---|---|
| Card headermenu | `more_vert` | Contextmenu openen |
| Sidebar toggle | `menu_open` / `menu` | Expanded / collapsed |
| Organisatiekeuze | `business`, `expand_more` | Switcher |
| Profielmenu | `account_circle`, `expand_more` | User menu |
| Zoekveld | `search` | Zoekactie |
| Dark mode | `dark_mode` | Thema |
| CV upload | `upload_file` | Bestand kiezen |
| AI-assistent | `auto_awesome` | AI paneel |

Geen icon-letter zichtbaar laten tijdens font loading: controleer font preload en CSS.
