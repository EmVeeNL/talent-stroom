# Asap Sharp font source

- Upstream: https://github.com/Omnibus-Type/Asap_Sharp
- Source commit: `41d013ad7c374fd7fc3f5fc99571b582020d509b`
- Input: `fonts/VARIABLE/AsapSharp[wdth,wght].ttf` at that commit
- License: SIL Open Font License 1.1, included as `OFL.txt`
- Output files: static normal-style WOFF2 at `wdth=100`, for weights 400, 500, 600, and 700.

Upstream did not contain WOFF2 files. Converted the TTF with FontTools 4.68.0 and Brotli 1.2.1 using:

```sh
PYTHONPATH=/tmp/fonttools-deps python3 -c 'from fontTools.ttLib import TTFont; from fontTools.varLib.instancer import instantiateVariableFont; src=TTFont("/tmp/asap-sharp.ttf"); [(lambda f,w: (setattr(f,"flavor","woff2"), f.save(f"packages/ui/fonts/asap-sharp/AsapSharp-{w}.woff2")))(instantiateVariableFont(src,{"wght":w,"wdth":100},inplace=False),w) for w in (400,500,600,700)]'
```
