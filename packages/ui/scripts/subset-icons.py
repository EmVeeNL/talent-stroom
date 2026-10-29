#!/usr/bin/env python3
"""Rebuild the self-hosted font. Installation and usage: ../fonts/material-symbols/SOURCE.md."""
import hashlib
import io
from pathlib import Path
import re
from urllib.request import urlopen

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables.otTables import Ligature
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
COMMIT = "10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7"
URL = f"https://raw.githubusercontent.com/google/material-design-icons/{COMMIT}/variablefont/MaterialSymbolsRounded%5BFILL,GRAD,opsz,wght%5D.ttf"


def ligatures(font):
    for lookup in font["GSUB"].table.LookupList.Lookup:
        for table in lookup.SubTable:
            if lookup.LookupType == 7:
                table = table.ExtSubTable
            if hasattr(table, "ligatures"):
                yield table.ligatures


def main():
    names = re.findall(r'"([a-z_]+)"', (ROOT / "src/icons.ts").read_text())
    with urlopen(URL) as response:
        source = response.read()
    # Immutable upstream plus a checksum prevents accidental input drift.
    expected = "7e74e36533ccee12c2b81e75bfcf3ccf123d3bb7e7e46d65d94445f23db0c97c"
    if hashlib.sha256(source).hexdigest() != expected:
        raise ValueError("Upstream font checksum mismatch")
    font = TTFont(io.BytesIO(source), recalcTimestamp=False)
    cmap = font.getBestCmap()
    # The design kit calls expand_more 'chevron_down'; upstream has no such name.
    alias = Ligature()
    alias.Component = [cmap[ord(c)] for c in "chevron_down"[1:]]
    alias.CompCount = len("chevron_down")
    alias.LigGlyph = "expand_more"
    next(ligatures(font)).setdefault(cmap[ord("c")], []).append(alias)

    glyphs = set()
    for name in names:
        sequence = [cmap[ord(c)] for c in name]
        matches = [lig.LigGlyph for table in ligatures(font)
                   for lig in table.get(sequence[0], []) if lig.Component == sequence[1:]]
        if not matches:
            raise ValueError(f"Missing upstream ligature: {name}")
        glyphs.update(sequence + matches)

    # Disable closure: otherwise the shared alphabet retains thousands of ligatures.
    options = subset.Options()
    options.layout_closure = False
    options.recalc_timestamp = False
    options.canonical_order = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(glyphs=glyphs)
    subsetter.subset(font)
    font = instantiateVariableFont(font, {"FILL": (0, 1), "wght": (400, 600), "GRAD": 0, "opsz": (20, 24)}, inplace=True)
    # Reject any loss of a requested GSUB sequence after subsetting/instancing.
    for name in names:
        sequence = [cmap[ord(c)] for c in name]
        if not any(lig.Component == sequence[1:] for table in ligatures(font)
                   for lig in table.get(sequence[0], [])):
            raise ValueError(f"Lost subset ligature: {name}")
    font.flavor = "woff2"
    output = ROOT / "fonts/material-symbols/MaterialSymbolsRounded.woff2"
    font.save(output, reorderTables=True)
    size = output.stat().st_size
    if size >= 200_000:
        raise ValueError(f"Font exceeds 200 KB: {size} bytes")
    print(f"{len(names)} ligatures; {size:,} bytes; {output}")


if __name__ == "__main__":
    main()
