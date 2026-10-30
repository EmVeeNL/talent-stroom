import { expect, test } from "@playwright/test";
import { output } from "./setup.ts";

const routes = [
  ["elementen-basis", "/elementen/basis"],
  ["elementen-geavanceerd", "/elementen/geavanceerd"],
  ["elementen-iconen", "/elementen/iconen"],
  ["elementen-kaarten", "/elementen/kaarten"],
  ["elementen-widgets", "/elementen/widgets"],
  ["elementen-overzicht", "/elementen/overzicht"],
  ["data-tabellen", "/data/tabellen"],
  ["data-grafieken", "/data/grafieken"],
  ["data-lijsten", "/data/lijsten"],
  ["formulieren-basis", "/formulieren/basis"],
  ["formulieren-geavanceerd", "/formulieren/geavanceerd"],
  ["formulieren-editors", "/formulieren/editors"],
  ["formulieren-groepen", "/formulieren/groepen"],
  ["formulieren-layout", "/formulieren/layout"],
  ["formulieren-validatie", "/formulieren/validatie"],
] as const;
for (const [slug, route] of routes)
  for (const theme of ["light", "dark"] as const)
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
    ]) {
      test(`${slug} · ${theme} · ${viewport.width}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.route("**/api/**", (request) => request.abort("blockedbyclient"));
        await page.goto(`${route}?preview=dashboard&theme=${theme}`);
        await expect(page.locator("main h1").first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        if (viewport.width === 390)
          expect(await page.locator("body").evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(390);
        await page.screenshot({
          path: `${output}/${slug}-${theme}-${viewport.width}.png`,
          fullPage: true,
          animations: "disabled",
        });
      });
    }
