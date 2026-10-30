import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../App.tsx";
import { demoAuthRoutes } from "../../routes.ts";

afterEach(() => vi.unstubAllGlobals());

describe("auth demo routes", () => {
  it.each([
    ["/paginas/authenticatie/tweestaps", "Tweestapsverificatie"],
    ["/paginas/authenticatie/vergrendeld", "Je sessie is vergrendeld"],
    ["/paginas/authenticatie/uitgelogd", "Je bent uitgelogd"],
    ["/paginas/authenticatie/gelukt", "Gelukt"],
  ])("renders %s without making API requests", async (path, heading) => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    vi.stubGlobal("fetch", fetch);
    window.history.replaceState(null, "", path);
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1, name: heading })).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("declares all auth demos public, auth-layout demo routes", () => {
    expect(demoAuthRoutes).toHaveLength(4);
    expect(demoAuthRoutes.every((route) => route.demo && route.layout === "auth" && route.access === "public")).toBe(
      true,
    );
  });

  it("shows a Demo toast when the six-digit sample form is submitted", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof globalThis.fetch>());
    window.history.replaceState(null, "", "/paginas/authenticatie/tweestaps");
    render(<App />);
    await userEvent.type(await screen.findByLabelText(/^Verificatiecode/), "123456");
    fireEvent.click(screen.getByRole("button", { name: "Verifiëren" }));
    expect(await screen.findByText("Demo")).toBeTruthy();
  });
});
