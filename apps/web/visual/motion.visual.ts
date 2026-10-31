import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 1000 } });

// Capture from the click itself, before Playwright's action can wait for a short
// animation to finish. No screenshots or animation-disabling styles in this spec.
async function animationAfterClick(page: Page, trigger: Locator, selector: string) {
  const observation = page.evaluate(
    (target) =>
      new Promise<boolean>((resolve) => {
        document.addEventListener(
          "click",
          () => {
            const start = performance.now();
            const sample = () => {
              const element = document.querySelector(target);
              const opacity = element ? Number(getComputedStyle(element).opacity) : 1;
              if (
                element &&
                (element.getAnimations().some((animation) => animation.playState === "running") ||
                  (opacity > 0 && opacity < 1))
              ) {
                resolve(true);
              } else if (performance.now() - start < 100) {
                requestAnimationFrame(sample);
              } else resolve(false);
            };
            requestAnimationFrame(sample);
          },
          { once: true, capture: true },
        );
      }),
    selector,
  );
  await trigger.click();
  return observation;
}

test("replay and Dialog open animate without React suspension warnings", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/hasn't mounted|called use\(\) to suspend/.test(message.text())) errors.push(message.text());
  });
  await page.route("**/api/**", (route) => route.abort("blockedbyclient"));
  await page.goto("/elementen/geavanceerd?preview=dashboard");
  const replay = page.locator(".motion-showcase-item").first().getByRole("button", { name: "Opnieuw afspelen" });
  await expect(replay).toBeVisible();
  // Let initial page/card entrances finish before observing an independent replay.
  await expect(page.locator(".motion-showcase-sample").first()).toHaveCSS("opacity", "1");
  expect(await animationAfterClick(page, replay, ".motion-showcase-sample")).toBe(true);
  await expect(page.locator(".motion-showcase-sample").first()).toHaveCSS("opacity", "1");
  const dialog = page.getByRole("button", { name: "Dialoogformaten: klein, middel en groot" });
  expect(await animationAfterClick(page, dialog, "dialog[open]")).toBe(true);
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});

for (const preference of ["os", "override"] as const) {
  test(`replay and Dialog settle immediately with ${preference} reduced motion`, async ({ page }) => {
    if (preference === "os") await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/elementen/geavanceerd?preview=dashboard");
    if (preference === "override") await page.locator(".motion-showcase-toggle input").check();
    await page.locator(".motion-showcase-item button").first().click();
    await expect(page.locator(".motion-showcase-sample").first()).toHaveCSS("opacity", "1");
    await page.getByRole("button", { name: "Dialoogformaten: klein, middel en groot" }).click();
    await expect(page.getByRole("dialog")).toHaveCSS("animation-name", "none");
    expect(await page.getByRole("dialog").evaluate((element) => element.getAnimations().length)).toBe(0);
  });
}

test("table avatars have at least 8px vertical breathing room", async ({ page }) => {
  for (const route of ["/", "/data/tabellen", "/elementen/overzicht"]) {
    // oxlint-disable-next-line no-await-in-loop -- sequential navigation on one page
    await page.goto(`${route}?preview=dashboard`);
    const avatars = page.locator("td .ts-avatar");
    // oxlint-disable-next-line no-await-in-loop
    await expect(avatars.first()).toBeVisible();
    // oxlint-disable-next-line no-await-in-loop
    const spacing = await avatars.evaluateAll((elements) =>
      elements.map((element) => {
        const cell = element.closest("td")?.getBoundingClientRect();
        const avatar = element.getBoundingClientRect();
        return cell ? Math.min(avatar.top - cell.top, cell.bottom - avatar.bottom) : 0;
      }),
    );
    expect(Math.min(...spacing)).toBeGreaterThanOrEqual(8);
  }
});
