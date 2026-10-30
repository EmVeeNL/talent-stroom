import { expect, test } from "@playwright/test";
import { output } from "./setup.ts";

const routes = [
  ["login", "/inloggen"],
  ["register", "/registreren"],
  ["forgot-password", "/wachtwoord-vergeten"],
  ["two-step", "/paginas/authenticatie/tweestaps"],
  ["locked", "/paginas/authenticatie/vergrendeld"],
  ["logged-out", "/paginas/authenticatie/uitgelogd"],
  ["success", "/paginas/authenticatie/gelukt"],
] as const;
const viewports = [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
];

test.describe("auth routes", () => {
  for (const theme of ["light", "dark"] as const) {
    for (const viewport of viewports) {
      for (const [name, path] of routes) {
        test(`${name} · ${theme} · ${viewport.width}`, async ({ page }) => {
          await page.setViewportSize(viewport);
          await page.emulateMedia({ colorScheme: theme });
          await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
          const url = path.startsWith("/paginas/") ? `${path}?theme=${theme}` : `${path}?preview=guest&theme=${theme}`;
          await page.goto(url);
          await expect(page.locator(".auth-card, .auth-content").first()).toBeVisible();
          await expect
            .poll(() =>
              page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
            )
            .toBe(true);
          await page.screenshot({
            path: `${output}/auth-${name}-${theme}-${viewport.width}.png`,
            fullPage: true,
            animations: "disabled",
          });
        });
      }
    }
  }
});
