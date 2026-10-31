/* oxlint-disable eslint/no-await-in-loop -- each calendar state must finish before the next screenshot */
import { expect, test } from "@playwright/test";
import { output } from "./setup.ts";

for (const theme of ["light", "dark"] as const) {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    test(`full agenda · ${theme} · ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.clock.install({ time: new Date("2026-10-30T11:20:00+01:00") });
      await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
      await page.goto(`/apps/agenda?preview=dashboard&theme=${theme}`);
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      for (const [view, label] of [
        ["month", "Maand"],
        ["week", "Week"],
        ["day", "Dag"],
      ] as const) {
        // Screenshots must capture each selected view in sequence.
        // eslint-disable-next-line no-await-in-loop
        await page.getByRole("radio", { name: label, exact: true }).click();
        // eslint-disable-next-line no-await-in-loop
        await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
        // eslint-disable-next-line no-await-in-loop
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
        // eslint-disable-next-line no-await-in-loop
        await page.screenshot({
          path: `${output}/agenda-${view}-${theme}-${viewport.width}.png`,
          fullPage: true,
          animations: "disabled",
        });
      }
      await page
        .getByRole("button", { name: /09:00.*Intake Dekker & Zonen/ })
        .filter({ visible: true })
        .first()
        .click();
      await expect(page.getByRole("dialog", { name: "Intake Dekker & Zonen" })).toBeVisible();
      await page.screenshot({
        path: `${output}/agenda-detail-${theme}-${viewport.width}.png`,
        fullPage: true,
        animations: "disabled",
      });
      await page.getByRole("dialog").getByRole("button", { name: "Sluiten", exact: true }).last().click();
      await page.getByRole("button", { name: "Nieuwe afspraak", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Nieuwe afspraak" })).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBeLessThanOrEqual(0);
      await page.screenshot({
        path: `${output}/agenda-new-${theme}-${viewport.width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    });
  }
}
