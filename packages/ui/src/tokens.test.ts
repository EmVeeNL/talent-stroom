// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast.ts";
import { cssVariables, darkCssVariables } from "./tokens.ts";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");
const rootBlock = /:root\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
const parsed = Object.fromEntries(
  [...rootBlock.matchAll(/^\s*(--[\w-]+):\s*(.+);$/gm)].map((match) => [match[1], match[2]]),
);

describe("tokens.ts and tokens.css", () => {
  it("define exactly the same variables with the same values", () => {
    expect(parsed).toEqual({ ...cssVariables });
  });
});

const v = (name: keyof typeof cssVariables): string => cssVariables[name];

/** [foreground, background, minimum ratio, description]. 4.5 = normal text, 3 = large text and UI components. */
const pairs: [keyof typeof cssVariables, keyof typeof cssVariables, number][] = [
  ["--ts-text", "--ts-bg", 4.5],
  ["--ts-text", "--ts-surface", 4.5],
  ["--ts-text", "--ts-surface-muted", 4.5],
  ["--ts-text-muted", "--ts-bg", 4.5],
  ["--ts-text-muted", "--ts-surface", 4.5],
  ["--ts-text-muted", "--ts-surface-muted", 4.5],
  ["--ts-text-on-primary", "--ts-primary", 4.5],
  ["--ts-text-on-primary", "--ts-primary-hover", 4.5],
  ["--ts-text-on-danger", "--ts-danger", 4.5],
  ["--ts-text-on-danger", "--ts-danger-hover", 4.5],
  ["--ts-primary-text", "--ts-surface", 4.5],
  ["--ts-primary-text", "--ts-primary-subtle", 4.5],
  ["--ts-primary", "--ts-surface", 4.5],
  ["--ts-primary", "--ts-bg", 4.5],
  ["--ts-danger-text", "--ts-surface", 4.5],
  ["--ts-danger-text", "--ts-danger-subtle", 4.5],
  ["--ts-success-text", "--ts-success-subtle", 4.5],
  ["--ts-success-text", "--ts-surface", 4.5],
  ["--ts-warning-text", "--ts-warning-subtle", 4.5],
  ["--ts-warning-text", "--ts-surface", 4.5],
  ["--ts-info-text", "--ts-info-subtle", 4.5],
  ["--ts-neutral-text", "--ts-neutral-subtle", 4.5],
  ["--ts-sidebar-text", "--ts-sidebar-bg", 4.5],
  ["--ts-sidebar-text", "--ts-sidebar-hover-bg", 4.5],
  ["--ts-sidebar-text-muted", "--ts-sidebar-bg", 4.5],
  ["--ts-sidebar-text-active", "--ts-sidebar-active-bg", 4.5],
  ["--ts-sidebar-accent", "--ts-sidebar-bg", 3],
  // UI components and focus indicators (3:1)
  ["--ts-border-strong", "--ts-surface", 3],
  ["--ts-border-strong", "--ts-surface-muted", 3],
  ["--ts-border-strong", "--ts-bg", 3],
  ["--ts-danger", "--ts-surface", 3],
  ["--ts-success", "--ts-surface", 3],
  ["--ts-warning", "--ts-surface", 3],
  ["--ts-focus-ring-color", "--ts-surface", 3],
  ["--ts-focus-ring-color", "--ts-bg", 3],
  ["--ts-focus-ring-color-on-dark", "--ts-sidebar-bg", 3],
];

describe("WCAG 2.2 AA contrast", () => {
  for (const [theme, variables] of Object.entries({ light: cssVariables, dark: darkCssVariables })) {
    it.each(pairs)(`${theme}: %s on %s is at least %s:1`, (foreground, background, minimum) => {
      expect(contrastRatio(variables[foreground], variables[background])).toBeGreaterThanOrEqual(minimum);
    });
  }
  it("mirrors dark overrides in both CSS selectors", () => {
    const blocks = [...css.matchAll(/color-scheme: dark;([\s\S]*?)\}/g)];
    expect(blocks).toHaveLength(2);
    for (const block of blocks) {
      const overrides = Object.fromEntries(
        [...(block[1] ?? "").matchAll(/(--[\w-]+):\s*(.+);/g)].map((m) => [m[1], m[2]]),
      );
      expect({ ...cssVariables, ...overrides }).toEqual(darkCssVariables);
    }
  });

  it("documents why the source muted text colour was darkened", () => {
    // Source token #68748A is 4.40:1 on the #F5F7FB page background, below 4.5:1.
    expect(contrastRatio("#68748a", v("--ts-bg"))).toBeLessThan(4.5);
  });
});
