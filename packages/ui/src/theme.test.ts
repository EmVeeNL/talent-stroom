import { afterEach, expect, it, vi } from "vitest";
import { getThemePreference, setThemePreference } from "./theme.ts";
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset["theme"];
});
it("defaults to system and rejects invalid stored preferences", () => {
  expect(getThemePreference()).toBe("system");
  localStorage.setItem("ts-theme", "invalid");
  expect(getThemePreference()).toBe("system");
});
it("applies both explicit themes and clears the attribute for system", () => {
  for (const theme of ["light", "dark"] as const) {
    setThemePreference(theme);
    expect(getThemePreference()).toBe(theme);
    expect(document.documentElement.dataset["theme"]).toBe(theme);
  }
  setThemePreference("system");
  expect(getThemePreference()).toBe("system");
  expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
});
it("handles unavailable storage while still applying the requested theme", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Unavailable");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Unavailable");
  });
  expect(getThemePreference()).toBe("system");
  expect(() => setThemePreference("dark")).not.toThrow();
  expect(document.documentElement.dataset["theme"]).toBe("dark");
});
