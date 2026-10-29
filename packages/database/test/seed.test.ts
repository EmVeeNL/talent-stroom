import { describe, expect, it } from "vitest";
import { assertLocalSeedTarget } from "../src/seed.ts";

describe("seed database safety", () => {
  it.each(["postgres://user:pass@localhost:5432/talentstroom", "postgres://user:pass@127.0.0.1:5432/talentstroom"])(
    "accepts a local talentstroom URL (%s)",
    (url) => {
      expect(() => assertLocalSeedTarget(url)).not.toThrow();
    },
  );

  it.each([
    "postgres://user:pass@example.com:5432/talentstroom",
    "postgres://user:pass@localhost:5432/production",
    "not a URL",
  ])("rejects an unsafe URL (%s)", (url) => {
    expect(() => assertLocalSeedTarget(url)).toThrow(/Refusing to seed/);
  });
});
