import { expect, test } from "@playwright/test";

for (const preference of ["full", "os", "override"] as const) {
  test.describe(`micro-interactions · ${preference}`, () => {
    test.use({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: preference === "os" ? "reduce" : "no-preference",
    });
    test.beforeEach(async ({ page }) => {
      await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
      if (preference === "override")
        await page.addInitScript(() => {
          const observer = new MutationObserver(() => {
            if (!document.documentElement) return;
            document.documentElement.dataset["motion"] = "reduce";
            observer.disconnect();
          });
          observer.observe(document, { childList: true, subtree: true });
        });
    });
    test("controls respond immediately and use token transitions", async ({ page }) => {
      await page.goto("/?gallery#forms");
      const duration = preference === "full" ? "0.12s" : "0s";
      const button = page.locator('.ts-button[data-state="active"]').first();
      await expect(button).toHaveCSS("transition-duration", preference === "full" ? "0.12s, 0.12s, 0.12s" : "0s");
      await expect(button).toHaveCSS("transform", preference === "full" ? "matrix(0.98, 0, 0, 0.98, 0, 0)" : "none");
      const checkbox = page.locator(".ts-check input:not(:disabled)").first();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
      await expect(checkbox.locator("+ .ts-check__visual")).toHaveCSS(
        "transition-duration",
        preference === "full" ? "0.12s, 0.12s" : "0s",
      );
      const radio = page.locator(".ts-radio-option input:not(:disabled)").first();
      await radio.check();
      await expect(radio).toBeChecked();
      await expect(radio).toHaveCSS("transition-duration", preference === "full" ? "0.12s, 0.12s" : "0s");
      const control = page.getByRole("switch").first();
      await control.click();
      await expect(control).toHaveAttribute("aria-checked", "true");
      await expect(control.locator(".ts-switch__track span")).toHaveCSS("transition-duration", duration);
      await expect(control.locator(".ts-switch__track span")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 18, 0)");
      await control.press("Space");
      await expect(control).toHaveAttribute("aria-checked", "false");
    });
    test("sidebar, tabs, count and sparkline settle without blocking focus", async ({ page }) => {
      await page.goto("/?gallery#layout");
      const sidebar = page.locator(".gallery-shell__app .ts-sidebar");
      await expect(sidebar).toHaveCSS("transition-duration", preference === "full" ? "0.32s" : "0s");
      const toggle = page.locator(".gallery-shell__app .ts-header button[aria-expanded]").first();
      await toggle.click();
      await expect(sidebar).toHaveClass(/ts-sidebar--collapsed/);
      await expect(sidebar.locator(".ts-sidebar__label").first()).toHaveCSS("opacity", "0");
      await expect(toggle).toBeFocused();
      await toggle.click();
      await expect(sidebar).not.toHaveClass(/ts-sidebar--collapsed/);
      await expect(sidebar.locator(".ts-sidebar__label").first()).toHaveCSS("opacity", "1");
      // The gallery shell has no expandable groups; the dashboard sidebar does ("Dashboard").
      await page.goto("/?preview=dashboard");
      const appSidebar = page.locator(".ts-sidebar").first();
      const group = appSidebar.locator("button[aria-controls]").first();
      await group.click();
      await expect(group).toHaveAttribute("aria-expanded", "false");
      await expect(appSidebar.locator("[inert]")).toHaveCount(1);
      await group.press("Enter");
      await expect(group).toHaveAttribute("aria-expanded", "true");
      await expect(group).toBeFocused();
      await page.goto("/?gallery#metrics");
      const line = page.locator(".ts-stat-card polyline").first();
      await expect(line).toBeVisible();
      // First-view motion must finish inside the slow token budget; final text is permanent.
      await expect(page.locator(".ts-stat-card__count").first()).toBeEmpty();
      await expect(page.locator(".ts-stat-card__value").first()).not.toBeEmpty();
      const card = page.locator(".ts-card").first();
      await expect(card).toHaveCSS("transition-duration", preference === "full" ? "0.12s" : "0s");
      const fill = page.locator(".ts-progress:not(.ts-progress--indeterminate) .ts-progress__fill").nth(2);
      await expect(fill).toHaveCSS("transform", "matrix(0.5, 0, 0, 1, 0, 0)");
      await expect(fill).toHaveCSS("transition-duration", preference === "full" ? "0.2s" : "0s");
      if (preference !== "full")
        await expect(page.locator(".ts-progress--indeterminate .ts-progress__fill")).toHaveCSS(
          "animation-name",
          "none",
        );
      const selected = page.locator('.gallery > .ts-tabs > .ts-tabs__list > [aria-selected="true"]');
      await selected.focus();
      await selected.press("ArrowRight");
      await expect(page.locator('.gallery > .ts-tabs > .ts-tabs__list > [aria-selected="true"]')).toBeFocused();
      const indicator = page.locator(".gallery > .ts-tabs > .ts-tabs__list > .ts-tabs__indicator");
      await expect
        .poll(async () => {
          const active = await page
            .locator('.gallery > .ts-tabs > .ts-tabs__list > [aria-selected="true"]')
            .boundingBox();
          const bounds = await indicator.boundingBox();
          return active && bounds ? Math.abs(active.x - bounds.x) + Math.abs(active.width - bounds.width) : 100;
        })
        .toBeLessThan(1);
    });
    test("filter chip removal immediately removes focus targets and permits re-add", async ({ page }) => {
      await page.goto("/?gallery#filters");
      const remove = page.locator(".ts-filter-chip__remove").first();
      await remove.click();
      await expect(page.locator(".ts-filter-chip--removable:not([inert])")).toHaveCount(1);
      await expect(page.locator(".ts-filter-chip--removable")).toHaveCount(1);
      await page.locator(".ts-filter-chip--add").click();
      await expect(page.locator(".ts-filter-chip--removable")).toHaveCount(2);
    });
  });
}
