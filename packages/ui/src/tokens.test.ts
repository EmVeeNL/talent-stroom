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

type Name = keyof typeof cssVariables;
const v = (name: Name): string => cssVariables[name];

const TEXT = 4.5;
const UI = 3;

/** Every surface a semantic text colour can sit on in the app shell. */
const surfaces: Name[] = ["--ts-bg", "--ts-surface", "--ts-surface-muted", "--ts-surface-raised"];
const on = (foreground: Name, backgrounds: Name[], minimum: number): [Name, Name, number][] =>
  backgrounds.map((background) => [foreground, background, minimum]);

/** [foreground, background, minimum ratio]. 4.5 = normal text, 3 = large text, UI components and focus. */
const pairs: [Name, Name, number][] = [
  // Body text
  ...on("--ts-text", surfaces, TEXT),
  ...on("--ts-text-muted", surfaces, TEXT),
  // Status actions use fixed navy ink in both themes (ADR 0013).
  ["--ts-neutral-900", "--ts-success", TEXT],
  ["--ts-neutral-900", "--ts-warning", TEXT],
  // Text on solid fills
  ["--ts-text-on-primary", "--ts-primary", TEXT],
  ["--ts-text-on-primary", "--ts-primary-hover", TEXT],
  ["--ts-text-on-danger", "--ts-danger", TEXT],
  ["--ts-text-on-danger", "--ts-danger-hover", TEXT],
  // Coloured text: on every surface and on its own subtle (label) background
  ...on("--ts-primary-text", [...surfaces, "--ts-primary-subtle"], TEXT),
  ...on("--ts-accent-text", [...surfaces, "--ts-accent-subtle"], TEXT),
  ...on("--ts-success-text", [...surfaces, "--ts-success-subtle"], TEXT),
  ...on("--ts-warning-text", [...surfaces, "--ts-warning-subtle"], TEXT),
  ...on("--ts-danger-text", [...surfaces, "--ts-danger-subtle"], TEXT),
  ...on("--ts-info-text", [...surfaces, "--ts-info-subtle"], TEXT),
  ...on("--ts-violet-text", [...surfaces, "--ts-violet-subtle"], TEXT),
  ...on("--ts-neutral-text", [...surfaces, "--ts-neutral-subtle"], TEXT),
  // Navy sidebar
  ...on("--ts-sidebar-text", ["--ts-sidebar-bg", "--ts-sidebar-hover-bg"], TEXT),
  ...on("--ts-sidebar-text-muted", ["--ts-sidebar-bg", "--ts-sidebar-hover-bg"], TEXT),
  ...on("--ts-sidebar-text-active", ["--ts-sidebar-bg", "--ts-sidebar-active-bg"], TEXT),
  ["--ts-sidebar-accent", "--ts-sidebar-bg", UI],
  ...on("--ts-focus-ring-color-on-dark", ["--ts-sidebar-bg", "--ts-sidebar-hover-bg", "--ts-sidebar-active-bg"], UI),
  // UI components (input boundaries, selected controls, invalid state) and focus indicators
  ...on("--ts-border-strong", surfaces, UI),
  // Solid fills as indicators sit on the page or a card; on muted/raised surfaces indicators use the
  // -text colour, which passes 4.5:1 on every surface (asserted above).
  ...on("--ts-primary", ["--ts-bg", "--ts-surface"], UI),
  ...on("--ts-danger", ["--ts-bg", "--ts-surface"], UI),
  ...on("--ts-focus-ring-color", surfaces, UI),
];

const themes = { light: cssVariables, dark: darkCssVariables };

describe("WCAG 2.2 AA contrast", () => {
  for (const [theme, variables] of Object.entries(themes)) {
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
});

/** Kit values that fail AA for the use the kit shows; each has a passing replacement (ADR 0013). */
describe("documented deviations from the design kit", () => {
  it("kit muted text #61718A is below 4.5:1 on the subtle surface, so muted text is darker", () => {
    expect(contrastRatio("#61718a", v("--ts-surface-muted"))).toBeLessThan(TEXT);
  });

  it("kit light status fills cannot carry text or meaning on white; -text variants are used instead", () => {
    for (const fill of ["--ts-success", "--ts-warning", "--ts-accent"] as const) {
      expect(contrastRatio(v(fill), "#ffffff")).toBeLessThan(UI);
    }
  });

  it("kit dark primary #4E82FF fails white button text, so the dark button fill is deeper", () => {
    expect(contrastRatio("#ffffff", "#4e82ff")).toBeLessThan(TEXT);
  });

  it("kit dark danger #FF6575 fails white button text, so it is the dark danger text colour", () => {
    expect(contrastRatio("#ffffff", "#ff6575")).toBeLessThan(TEXT);
    expect(darkCssVariables["--ts-danger-text"]).toBe("#ff6575");
  });

  it("kit line colour #D8E2EF is decorative; input boundaries use --ts-border-strong", () => {
    expect(contrastRatio(v("--ts-border"), v("--ts-surface"))).toBeLessThan(UI);
  });
});
