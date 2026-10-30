import { expect, test } from "@playwright/test";
import { output } from "./setup.ts";
const routes = ["/dashboard/deals", "/dashboard/leads", "/dashboard/salaris", "/dashboard/aanwezigheid"];
for (const route of routes)
  for (const theme of ["light", "dark"] as const)
    for (const width of [1440, 390]) {
      test(`${route} · ${theme} · ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.route("**/api/**", (request) => request.abort("blockedbyclient"));
        await page.goto(`${route}?preview=dashboard&theme=${theme}`);
        await expect(page.locator("h1")).toBeVisible();
        await page.screenshot({
          path: `${output}/${route.split("/").at(-1)}-${theme}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
      });
    }
