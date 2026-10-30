import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Load a fresh entry module under production flags, including the demo-enabled build.
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});
it.each(["dashboard", "guest"])("ignores production preview=%s even when demos are enabled", async (mode) => {
  vi.stubEnv("DEV", false);
  vi.stubEnv("VITE_DEMO_PAGES", "true");
  vi.resetModules();
  window.history.replaceState(null, "", `/?preview=${mode}`);
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json(null));
  vi.stubGlobal("fetch", fetchMock);
  const { App } = await import("./App.tsx");
  render(<App />);
  await screen.findByRole("heading", { name: "Welkom terug" });
  expect(window.location.pathname).toBe("/inloggen");
  expect(fetchMock).toHaveBeenCalled();
});
it("disables production demos by default and rejects production harness search state", async () => {
  vi.stubEnv("DEV", false);
  vi.stubEnv("VITE_DEMO_PAGES", undefined);
  vi.resetModules();
  const { demoPagesEnabled } = await import("./routes.ts");
  const { validateRouteSearch } = await import("./router.tsx");
  expect(demoPagesEnabled).toBe(false);
  expect(validateRouteSearch({ preview: "dashboard", theme: "dark" })).toEqual({});
});

it.each([
  [true, undefined, true],
  [true, "false", false],
  [true, "TRUE", false],
  [false, undefined, false],
  [false, "true", true],
  [false, "false", false],
] as const)("preserves demo flag semantics (DEV=%s, flag=%s)", async (dev, flag, enabled) => {
  vi.stubEnv("DEV", dev);
  vi.stubEnv("VITE_DEMO_PAGES", flag);
  vi.resetModules();
  const { demoPagesEnabled } = await import("./routes.ts");
  expect(demoPagesEnabled).toBe(enabled);
});
