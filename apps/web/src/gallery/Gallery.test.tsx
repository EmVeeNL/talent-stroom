import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Gallery } from "./Gallery.tsx";

afterEach(() => {
  cleanup();
  localStorage.clear();
  delete document.documentElement.dataset["theme"];
  window.history.replaceState(null, "", "/");
});

describe("gallery URL theme override", () => {
  it.each(["light", "dark"])("does not create a preference when forcing %s", (theme) => {
    window.history.replaceState(null, "", `/?gallery&theme=${theme}`);
    render(<Gallery />);
    expect(document.documentElement.dataset["theme"]).toBe(theme);
    expect(screen.queryByRole("radio", { name: "Systeem" })).toBeNull();
    expect(localStorage.getItem("ts-theme")).toBeNull();
    cleanup();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it.each(["light", "dark"])("forces %s without changing the saved preference", (theme) => {
    localStorage.setItem("ts-theme", "dark");
    document.documentElement.dataset["theme"] = "dark";
    window.history.replaceState(null, "", `/?gallery&theme=${theme}#forms`);
    render(<Gallery />);
    expect(document.documentElement.dataset["theme"]).toBe(theme);
    expect(localStorage.getItem("ts-theme")).toBe("dark");
    expect(screen.getByRole("tab", { selected: true }).id).toContain("forms");
    cleanup();
    expect(document.documentElement.dataset["theme"]).toBe("dark");
  });

  it.each(["", "&theme=invalid", "&theme=system"])("ignores an absent or invalid override (%s)", (query) => {
    document.documentElement.dataset["theme"] = "light";
    window.history.replaceState(null, "", `/?gallery${query}`);
    render(<Gallery />);
    expect(document.documentElement.dataset["theme"]).toBe("light");
    expect(localStorage.getItem("ts-theme")).toBeNull();
    expect(screen.getByRole("radio", { name: "Systeem" })).toBeDefined();
  });
});
