import { expect, test } from "@playwright/test";
import { output } from "./setup.ts";

for (const width of [1440, 390]) {
  test(`detail and form keyboard lifecycle · ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
    await page.goto("/apps/contacten?preview=dashboard&theme=light");
    const opener = page.locator(".contact-row").first();
    await opener.focus();
    await page.keyboard.press("Enter");
    const drawer = page.getByRole("dialog");
    await expect(drawer.getByRole("heading", { level: 2 })).toBeFocused();
    const edit = drawer.getByRole("button", { name: "Bewerken", exact: true });
    await edit.click();
    const form = page.getByRole("dialog", { name: "Bewerken", exact: true });
    await expect(form.getByRole("textbox", { name: "Naam", exact: true })).toBeFocused();
    await form.getByRole("textbox", { name: "Naam", exact: true }).fill("Synthetisch gewijzigd");
    await page.keyboard.press("Escape");
    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByRole("button", { name: "Verder bewerken" })).toBeFocused();
    await page.screenshot({ path: `${output}/form-confirm-${width}.png`, fullPage: true });
    await page.keyboard.press("Tab");
    await expect(confirm.getByRole("button", { name: "Verwerpen", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(confirm.getByRole("button", { name: "Verder bewerken" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(confirm).not.toBeVisible();
    await expect(form).toBeVisible();
    await form.getByRole("button", { name: "Opslaan", exact: true }).click();
    await expect(form).not.toBeVisible();
    await expect(edit).toBeFocused();
    await expect(drawer.getByRole("heading", { name: "Synthetisch gewijzigd" })).toBeVisible();
    await page.screenshot({ path: `${output}/detail-drawer-${width}.png`, fullPage: true });
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(
      0,
    );
  });
}
