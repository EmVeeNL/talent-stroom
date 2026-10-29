# Material Symbols Rounded

TalentStroom self-hosts a **Rounded** variable WOFF2 subset under Apache-2.0. The 91 available ligatures live in one inventory: `packages/ui/src/icons.ts` (`ICON_NAMES` / `IconName`, exported through `@talentstroom/ui`). The font is **26,092 bytes** (under 200 KB), replacing the 4,001,808-byte Outlined font.

Upstream commit, checksum, license and reproducible Python/FontTools commands are recorded in `packages/ui/fonts/material-symbols/SOURCE.md`. No external font service is contacted at runtime.

```tsx
import { Icon } from "@talentstroom/ui";

<Icon name="search" />; // decorative, 20px
<Icon name="warning" size={24} label={translatedWarning} />; // role=img
<Icon name="star" size={32} filled />;
```

- Sizes: **16** inline, **20** default, **24** navigation, **32** illustrative. Optical size is 20 at 16/20px and 24 at 24/32px.
- FILL 0 by default; `filled` sets FILL 1 without changing optical size. Weight 400, GRAD 0. Font axes retain FILL 0–1, wght 400–600 and opsz 20–24.
- Decorative icons have `aria-hidden`; `label` adds `role="img"` and `aria-label`. Translate labels through i18n. Icon-only `Button` calls require `aria-label` at the type level.
- Import `@talentstroom/ui/fonts.css` and `components.css`. The family/class are `Material Symbols Rounded` / `material-symbols-rounded`.
- The design kit's `chevron_down` is a documented compatibility ligature for `expand_more` because upstream has no `chevron_down` glyph.

## Loading and verification

Both `apps/web/index.html` and the site's `Base.astro` preload the same WOFF2 used by CSS, with anonymous CORS. Vite/Astro emit the matching hashed asset URL. Only the icon face uses `font-display: block`; text faces retain `swap`. Each `Icon` reserves a square of its requested size and clips overflow. The browser's font block period hides ligature text while loading; this is a short browser-defined period, not an indefinite network-failure guarantee.

The dev gallery at `/?gallery&theme=light#layout` (or `theme=dark`) shows every ligature with its name and all four sizes, plus labelled/decorative and filled examples. The theme query applies only in development.

Verification artifacts are recorded below after the browser pass. The inventory test scans production TSX/Astro sources and all foundation names; the TypeScript checks cover dynamic names and reject unknown ligatures. The subset script validates GSUB presence before and after processing and enforces the size budget.

### Browser evidence (2026-10-29)

Verified on port **5177** with Chrome for Testing headless shell 142.0.7444.175, using `--single-process --no-zygote --no-sandbox --disable-gpu` because the installed Chrome cannot initialize macOS application services inside this execution sandbox. These flags apply only to the disposable verification process.

- `/tmp/redesign-icons-light.png` — 1440×1000, light.
- `/tmp/redesign-icons-dark.png` — 1440×1000, dark.
- `/tmp/redesign-icons-mobile.png` — 390×1000, no horizontal page overflow.
- `/tmp/redesign-icons-font-loading.png` — font request held through Chrome DevTools interception, captured 800ms after the gallery rendered; `document.fonts.status` was `loading` and `document.fonts.check` was false. Icon boxes are blank, with no ligature text flash or size collapse.
- `/tmp/redesign-icons-visual.json` — measured 16/20/24/32px square boxes, correct optical-size axes, 91 inventory entries, successful font load in both themes and one matching preload/font URL. The Vite dev plugin resolves the external workspace asset to the same `/@fs/` URL used by CSS; production uses the normal hashed asset URL.

Rebuilding the subset twice produced identical SHA-256 `944e264dff1d317948f12e4ba32c046f01045120a63e212d32f2b02d39f4e6ad`. `pnpm build` passed. The complete `pnpm check` passed, including all UI tests. Initial parallel runs exposed an existing Toast test's 200ms real-time hover race; a single-worker run and subsequent default runs passed. No test or lint configuration was changed. Status-pill icons now use the supported 16px inline size instead of a 14px CSS override.
