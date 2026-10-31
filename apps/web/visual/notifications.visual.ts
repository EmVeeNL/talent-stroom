import { expect, test } from "@playwright/test";
import { output } from "./setup.ts";

for (const width of [1440, 390]) {
  test(`notification centre keyboard and preferences · ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
    await page.goto("/apps/agenda?preview=dashboard&theme=light");
    const bell = page.getByRole("button", { name: "Meldingen: 5 ongelezen" });
    await bell.focus();
    await bell.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Meldingen", exact: true });
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveCSS("animation-name", "none");
    const close = sheet.getByRole("button", { name: "Sluiten", exact: true });
    await expect(close).toBeFocused();
    // Native modal <dialog> keeps Tab inside the dialog (or the browser UI); it does not wrap.
    await page.keyboard.press("Tab");
    expect(await sheet.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await close.focus();
    expect(await sheet.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: `${output}/notifications-${width}.png`, animations: "disabled" });
    await page.keyboard.press("Escape");
    await expect(bell).toBeFocused();
    await bell.click();
    await sheet.getByRole("button", { name: "Meldingsvoorkeuren" }).click();
    const preferences = page.getByRole("dialog", { name: "Meldingsvoorkeuren" });
    await expect(preferences).toBeVisible();
    await preferences.getByRole("checkbox", { name: "Nieuwe berichten" }).uncheck();
    await preferences.getByRole("combobox").selectOption("5");
    await page.screenshot({ path: `${output}/notification-preferences-${width}.png`, animations: "disabled" });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Meldingen: 3 ongelezen" })).toBeFocused();
    // The profile settings entry opens the same preferences, with focus returned to its trigger.
    const profile = page.getByRole("button", { name: /Gebruikersmenu:/ });
    await profile.click();
    await page.getByRole("menuitem", { name: "Instellingen", exact: true }).click();
    await expect(preferences.getByRole("checkbox", { name: "Nieuwe berichten" })).not.toBeChecked();
    await expect(preferences.getByRole("combobox")).toHaveValue("5");
    await page.keyboard.press("Escape");
    await expect(profile).toBeFocused();
    await page.getByRole("button", { name: "Meldingen: 3 ongelezen" }).click();
    await sheet.getByRole("link", { name: "Demotaak verloopt vandaag" }).click();
    await expect(page).toHaveURL(/\/apps\/kanban$/);
    await expect(page.getByRole("button", { name: "Meldingen: 2 ongelezen" })).toBeVisible();
  });
}
