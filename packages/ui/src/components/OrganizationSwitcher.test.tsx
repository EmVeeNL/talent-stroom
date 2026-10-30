import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { OrganizationSwitcher } from "./OrganizationSwitcher.tsx";

const organizations = [
  { id: "a", name: "Testbureau Noord" },
  { id: "b", name: "Testbureau Zuid" },
  { id: "c", name: "Voorbeeld Werving" },
];
const labels = {
  title: "Switch organisatie",
  search: "Zoek organisatie…",
  current: "Huidige organisatie",
  create: "Nieuwe organisatie",
  empty: "Geen organisaties gevonden",
  busy: "Organisatie wisselen…",
};

it("opens with the current organization checked, filters and selects with the keyboard", async () => {
  const onSelect = vi.fn<(id: string) => void>();
  const { container } = render(
    <OrganizationSwitcher
      organizations={organizations}
      currentId="a"
      labels={labels}
      onSelect={onSelect}
      createHref="/organisatie-kiezen"
    />,
  );
  const trigger = screen.getByRole("button", { name: "Switch organisatie: Testbureau Noord" });
  await userEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const dialog = screen.getByRole("dialog", { name: "Switch organisatie" });
  const search = screen.getByRole("combobox", { name: "Zoek organisatie…" });
  expect(document.activeElement).toBe(search);
  const current = screen.getByRole("option", { name: /Testbureau Noord/ });
  expect(current.getAttribute("aria-selected")).toBe("true");
  expect(search.getAttribute("aria-activedescendant")).toBe(current.id);
  expect(screen.getByRole("link", { name: "Nieuwe organisatie" }).getAttribute("href")).toBe("/organisatie-kiezen");
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.keyboard("{ArrowDown}");
  expect(search.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: /Zuid/ }).id);
  await userEvent.keyboard("{End}{ArrowDown}");
  expect(search.getAttribute("aria-activedescendant")).toBe(current.id);
  await userEvent.type(search, "voorbeeld");
  expect(screen.getAllByRole("option")).toHaveLength(1);
  await userEvent.keyboard("{Enter}");
  expect(onSelect).toHaveBeenCalledWith("c");
  expect(dialog.isConnected).toBe(true);
});

it("closes with Escape and returns focus; choosing the current organization does not switch", async () => {
  const onSelect = vi.fn<(id: string) => void>();
  render(<OrganizationSwitcher organizations={organizations} currentId="a" labels={labels} onSelect={onSelect} />);
  const trigger = screen.getByRole("button", { name: /Switch organisatie/ });
  await userEvent.click(trigger);
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(trigger);
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole("option", { name: /Testbureau Noord/ }));
  expect(onSelect).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

it("announces errors and the empty result", async () => {
  render(
    <OrganizationSwitcher
      organizations={organizations}
      currentId="a"
      labels={labels}
      onSelect={() => undefined}
      error="Dit is niet gelukt."
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: /Switch organisatie/ }));
  expect(screen.getByRole("alert").textContent).toBe("Dit is niet gelukt.");
  await userEvent.type(screen.getByRole("combobox"), "xyz");
  expect(screen.getByRole("status").textContent).toBe("Geen organisaties gevonden");
});
