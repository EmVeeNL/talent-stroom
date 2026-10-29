import axe from "axe-core";

/** Run axe-core on a rendered container and return violation summaries (empty = pass).
 * `color-contrast` is skipped because jsdom has no layout; contrast is asserted on tokens in contrast.test.ts. */
export async function axeViolations(container: Element): Promise<string[]> {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}
