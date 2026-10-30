import { expect, test } from "@playwright/test";
import { output } from "./setup.ts";

const viewports = [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
];

const routes = [
  { slug: "agenda", heading: "Agenda" },
  { slug: "chat", heading: "Chat" },
  { slug: "kanban", heading: "Kanbanbord" },
  { slug: "crm", heading: "CRM" },
  { slug: "notities", heading: "Notities" },
  { slug: "contacten", heading: "Contacten" },
] as const;

for (const theme of ["light", "dark"] as const) {
  for (const viewport of viewports) {
    test(`apps · ${theme} · ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
      for (const { slug, heading } of routes) {
        // Each route shares one page and must finish before the next.
        // eslint-disable-next-line no-await-in-loop
        await test.step(`${slug} · ${theme} · ${viewport.width}`, async () => {
          await page.goto(`/apps/${slug}?preview=dashboard&theme=${theme}`);
          await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
          await page.evaluate(async () => {
            await document.fonts.ready;
          });
          // Nothing may overflow horizontally; wide content scrolls inside its own region.
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow).toBeLessThanOrEqual(0);
          await page.screenshot({
            path: `${output}/apps-${slug}-${theme}-${viewport.width}.png`,
            fullPage: true,
            animations: "disabled",
          });
        });
      }
    });
  }
}
