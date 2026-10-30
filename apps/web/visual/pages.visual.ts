import { expect, test } from "@playwright/test";
import { output } from "./setup.ts";
const routes = [
  "/paginas/authenticatie",
  "/paginas/fouten",
  "/paginas/start",
  "/paginas/profiel",
  "/paginas/prijzen",
  "/paginas/faq",
  "/paginas/contact",
];
for (const route of routes)
  for (const theme of ["light", "dark"] as const)
    for (const width of [1440, 390]) {
      test(`${route} ${theme} ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.route("**/api/**", (r) => r.abort("blockedbyclient"));
        await page.goto(`${route}?preview=dashboard&theme=${theme}`);
        await expect(page.locator("main")).toBeVisible();
        await expect(page.locator("h1").first()).toBeVisible();
        await page.screenshot({
          path: `${output}/${route.slice(1).replaceAll("/", "-")}-${theme}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
      });
    }
