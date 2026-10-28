import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, isLocale, t } from "./index.ts";

describe("t", () => {
  it("defaults to Dutch", () => {
    expect(DEFAULT_LOCALE).toBe("nl-NL");
    expect(t("nl-NL", "nav.clients")).toBe("Opdrachtgevers");
  });

  it("interpolates placeholders", () => {
    expect(t("en-GB", "app.welcome", { app: "TalentStroom" })).toBe("Welcome to TalentStroom");
  });

  it("leaves unknown placeholders intact", () => {
    expect(t("nl-NL", "app.welcome")).toBe("Welkom bij {app}");
  });
});

describe("isLocale", () => {
  it("accepts supported locales only", () => {
    expect(isLocale("en-GB")).toBe(true);
    expect(isLocale("de-DE")).toBe(false);
  });
});
