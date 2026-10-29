# Google Material Symbols

Use **Material Symbols Outlined** as the default icon family, consistent 24px viewBox; 20px in dense tables, 24px for navigation. Filled states may use FILL=1.

Official guide: https://developers.google.com/fonts/docs/material_symbols
Icon browser: https://fonts.google.com/icons
License: Apache-2.0 (see official repository).

Recommended names: `dashboard`, `work`, `person`, `groups`, `task_alt`, `calendar_month`, `insights`, `search`, `add`, `upload_file`, `share`, `shield`, `lock`, `translate`, `auto_awesome`, `settings`, `apartment`, `arrow_drop_down`. Verify exact ligature spelling against the current catalog.

The production font is self-hosted by `@talentstroom/ui/fonts.css`:

```html
<span class="material-symbols-outlined" aria-hidden="true">dashboard</span>
```

For buttons, provide an accessible label; decorative glyphs should be hidden from assistive technology. The licensed variable font is bundled in `packages/ui/fonts/material-symbols/`.
