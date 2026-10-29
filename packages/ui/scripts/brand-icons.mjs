#!/usr/bin/env node
// Generates favicons and app icons from src/brand/talentstroom-mark.svg into apps/web/public and apps/site/public.
// Requires: Node >= 22 and `rsvg-convert` (brew install librsvg). Run: pnpm --filter @talentstroom/ui brand-icons
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const source = readFileSync(join(root, "packages/ui/src/brand/talentstroom-mark.svg"), "utf8").trim();
const inner = source
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>$/, "")
  .trim();
const MARK_W = 151;
const MARK_H = 126;

/** Square SVG with the mark centred. `pad` is the margin as a fraction of the side; `background` fills the square. */
function squareSvg({ pad, background }) {
  const side = MARK_W / (1 - 2 * pad);
  const x = (MARK_W - side) / 2;
  const y = (MARK_H - side) / 2;
  const bg = background ? `<rect x="${x}" y="${y}" width="${side}" height="${side}" fill="${background}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${side} ${side}" fill="none">${bg}${inner}</svg>\n`;
}

const manifest = {
  name: "TalentStroom",
  short_name: "TalentStroom",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  theme_color: "#111827",
  background_color: "#ffffff",
  display: "browser",
};

const work = mkdtempSync(join(tmpdir(), "ts-brand-"));
function png(svg, size) {
  const input = join(work, `in-${size}-${svg.length}.svg`);
  writeFileSync(input, svg);
  return execFileSync("rsvg-convert", ["-w", String(size), "-h", String(size)].concat(input));
}

/** ICO container embedding PNG images (supported by all current browsers). */
function ico(images) {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    head.writeUInt8(size, at);
    head.writeUInt8(size, at + 1);
    head.writeUInt16LE(1, at + 4);
    head.writeUInt16LE(32, at + 6);
    head.writeUInt32LE(data.length, at + 8);
    head.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...images.map((i) => i.data)]);
}

try {
  const favicon = squareSvg({ pad: 0.03 });
  const tile = squareSvg({ pad: 0.18, background: "#ffffff" });
  const icoData = ico([16, 32, 48].map((size) => ({ size, data: png(squareSvg({ pad: 0.02 }), size) })));
  for (const app of ["web", "site"]) {
    const out = join(root, "apps", app, "public");
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "favicon.svg"), favicon);
    writeFileSync(join(out, "favicon.ico"), icoData);
    writeFileSync(join(out, "apple-touch-icon.png"), png(tile, 180));
    writeFileSync(join(out, "icon-192.png"), png(tile, 192));
    writeFileSync(join(out, "icon-512.png"), png(tile, 512));
    writeFileSync(join(out, "site.webmanifest"), `${JSON.stringify(manifest, null, 2)}\n`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
