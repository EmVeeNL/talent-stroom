# Material Symbols Rounded source

- Upstream: https://github.com/google/material-design-icons
- Fixed source commit: `10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7`
- Source: `variablefont/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].ttf`
- Source SHA-256: `7e74e36533ccee12c2b81e75bfcf3ccf123d3bb7e7e46d65d94445f23db0c97c`
- License: Apache-2.0, included as `LICENSE`.
- Output: `MaterialSymbolsRounded.woff2`, **26,728 bytes**, 92 ligatures.
- Axes: FILL 0–1, wght 400–600, opsz 20–24; GRAD pinned to 0.

## Reproduce from the repository root

Python 3.12, with pinned FontTools and WOFF2 compression dependencies in a disposable virtual environment (no runtime dependency):

```sh
python3 -m venv /tmp/talentstroom-icons-venv
/tmp/talentstroom-icons-venv/bin/pip install fonttools==4.60.1 brotli==1.2.1 zopfli==0.4.3
/tmp/talentstroom-icons-venv/bin/python packages/ui/scripts/subset-icons.py
```

The script downloads the immutable upstream TTF, verifies its checksum, reads the single inventory `packages/ui/src/icons.ts`, validates every GSUB ligature, subsets without layout closure (which would otherwise keep all icons sharing the alphabet), and restricts axes with `instantiateVariableFont`. It preserves the source timestamp and verifies ligatures again before writing WOFF2. Output exceeding 200,000 bytes fails.

The design kit specifies `chevron_down`, which does not exist upstream. The script adds that ligature as an alias for upstream `expand_more`; both names render the same Rounded glyph. This is the only compatibility alias.

To add an icon, update `ICON_NAMES`, rerun the script, and run `pnpm check`. The source-scanning inventory test covers the foundation spec and literal production icon usages; TypeScript checks names passed dynamically through all icon-bearing component props. The gallery renders the entire inventory.
