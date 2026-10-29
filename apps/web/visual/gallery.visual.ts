import { readdir, writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { output } from "./setup.ts";

const viewports = [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
];

test.afterAll(async () => {
  const files = (await readdir(output)).filter((name) => name.endsWith(".png")).toSorted();
  const figures = files.map((name) => {
    const caption = name.slice(0, -4).replaceAll("-", " · ");
    return `<figure><a href="${encodeURIComponent(name)}"><img loading="lazy" src="${encodeURIComponent(name)}" alt="${caption}"></a><figcaption>${caption}</figcaption></figure>`;
  });
  await writeFile(
    `${output}/index.html`,
    `<!doctype html>
<html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>TalentStroom — Visual review</title>
<style>body{font:16px/1.5 system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}figure{margin:0}img{width:100%;max-height:600px;object-fit:contain;object-position:top;border:1px solid #aaa}figcaption{padding:8px 0}</style>
<h1>TalentStroom — Visual review</h1><p>${files.length} screenshots · Chromium · nl-NL · DPR 1</p>
<p>Auth capture pending: /inloggen, /registreren and /organisatie-kiezen are not implemented in this worktree.</p>
<main>${figures.join("\n")}</main></html>`,
  );
});

for (const theme of ["light", "dark"] as const) {
  for (const viewport of viewports) {
    test(`gallery · ${theme} · ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: theme });
      // Never let a gallery example reach the local API or expose real data.
      await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
      await page.clock.install({ time: new Date("2026-01-15T12:00:00Z") });
      await page.goto(`/?gallery&theme=${theme}`);
      await expect(page.locator(".gallery")).toBeVisible();
      // Import through Vite in the browser: the registry imports TSX and CSS, which
      // cannot be imported directly in Playwright's Node test runner.
      const ids = await page.evaluate(async () => {
        const registryUrl = "/src/gallery/pages/index.ts";
        const registry: unknown = await import(/* @vite-ignore */ registryUrl);
        if (
          typeof registry !== "object" ||
          registry === null ||
          !("pages" in registry) ||
          !Array.isArray(registry.pages)
        ) {
          throw new Error("Missing gallery page registry");
        }
        return registry.pages.map((entry: unknown) => {
          if (
            typeof entry !== "object" ||
            entry === null ||
            !("id" in entry) ||
            typeof entry.id !== "string" ||
            !/^[a-z0-9-]+$/.test(entry.id)
          ) {
            throw new Error("Gallery page IDs must be filename-safe slugs");
          }
          return entry.id;
        });
      });
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        // Each navigation and screenshot shares one page and must finish before the next.
        // eslint-disable-next-line no-await-in-loop
        await test.step(`${id} · ${theme} · ${viewport.width}`, async () => {
          await page.goto(`/?gallery&theme=${theme}#${id}`);
          await expect(page.locator(`.gallery > .ts-tabs > [role="tabpanel"]:not([hidden])`)).toHaveAttribute(
            "id",
            new RegExp(`-panel-${id}$`),
          );
          await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
          await page.evaluate(async () => {
            await document.fonts.ready;
            // FontFaceSet.check alone also succeeds for nonexistent families.
            // Require actual loaded faces for text and the icon family in use.
            // Pages without icons (e.g. charts) only need the text font.
            const icon = document.querySelector(".material-symbols-rounded, .material-symbols-outlined");
            const iconFamily = icon
              ? getComputedStyle(icon).fontFamily.split(",")[0]?.replaceAll('"', "").trim()
              : undefined;
            await Promise.all(
              ["Asap Sharp", ...(icon ? [iconFamily] : [])].map(async (family) => {
                if (!family) throw new Error("Missing font family");
                const loaded = await document.fonts.load(`16px "${family}"`);
                if (loaded.length === 0 || loaded.some((face) => face.status !== "loaded")) {
                  throw new Error(`Font not loaded: ${family}`);
                }
              }),
            );
          });
          await page.screenshot({
            path: `${output}/${id}-${theme}-${viewport.width}.png`,
            fullPage: true,
            animations: "disabled",
          });
        });
      }
    });
  }
}
