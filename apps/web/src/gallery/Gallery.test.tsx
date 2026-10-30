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

it("shows bounded overlay previews without interaction or taking focus", () => {
  window.history.replaceState(null, "", "/?gallery#overlays");
  render(<Gallery />);
  expect(screen.getByRole("alertdialog", { name: "Kandidaat verwijderen?" }).getAttribute("aria-modal")).not.toBe(
    "true",
  );
  expect(screen.getByRole("dialog", { name: "Kandidaatacties" })).toBeDefined();
  expect(screen.getByRole("tooltip")).toBeDefined();
  expect(screen.getByRole("listbox")).toBeDefined();
  expect(screen.getByRole("grid", { name: "oktober 2026" })).toBeDefined();
  expect(screen.getByPlaceholderText("Kies een opdrachtgever")).toBeDefined();
  expect(document.activeElement).toBe(document.body);
});
