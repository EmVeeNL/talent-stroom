import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ICON_NAMES } from "./icons.ts";

const root = fileURLToPath(new URL("../../../", `file://${import.meta.filename}`));
describe("icon inventory", () => {
  it("contains every foundation ligature and literal icon usage", () => {
    const spec = readFileSync(`${root}/docs/images/redesign/docs/foundations/04-icons.md`, "utf8");
    const expected = [...spec.matchAll(/`([a-z][a-z_]+)`/g)].map((match) => match[1]);
    for (const dir of ["packages/ui/src", "apps/web/src", "apps/site/src"]) {
      for (const file of readdirSync(`${root}/${dir}`, { recursive: true, encoding: "utf8" })) {
        if (!/\.(tsx|astro)$/.test(file) || file.endsWith(".test.tsx")) continue;
        const source = readFileSync(`${root}/${dir}/${file}`, "utf8");
        for (const match of source.matchAll(/(?:<Icon\s+name|\bicon)=["']([a-z_]+)["']/g)) expected.push(match[1]);
      }
    }
    for (const name of expected) expect(ICON_NAMES).toContain(name);
    expect(new Set(ICON_NAMES).size).toBe(ICON_NAMES.length);
  });
});
