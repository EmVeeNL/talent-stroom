import { expect, test } from "@playwright/test";
import { output } from "./setup.ts";
const routes = [
  { slug: "recruitment", path: "/" },
  { slug: "admin", path: "/dashboard/admin" },
  { slug: "medewerker", path: "/dashboard/medewerker" },
  { slug: "hr", path: "/dashboard/hr" },
];
for (const route of routes)
  for (const theme of ["light", "dark"] as const)
    for (const width of [1440, 390])
      test(`${route.slug} · ${theme} · ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await page.emulateMedia({ colorScheme: theme });
        await page.route("**/api/**", (r) => r.abort("blockedbyclient"));
        await page.clock.install({ time: new Date("2026-10-30T12:00:00Z") });
        await page.goto(`${route.path}?preview=dashboard&theme=${theme}`);
        await expect(page.locator(".demo-dashboard")).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await page.screenshot({
          path: `${output}/${route.slug}-${theme}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
      });
