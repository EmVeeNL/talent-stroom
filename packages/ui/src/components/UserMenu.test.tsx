import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { UserMenu } from "./UserMenu.tsx";

const labels = {
  menu: "Gebruikersmenu",
  profile: "Mijn profiel",
  settings: "Instellingen",
  darkMode: "Donkere modus",
  language: "Taal",
  shortcuts: "Sneltoetsen",
  help: "Help en support",
  signOut: "Uitloggen",
  soon: "Binnenkort",
};
afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset["theme"];
});
function setup(onSignOut = vi.fn<() => void>(), onLanguageChange = vi.fn<() => void>()) {
  return {
    onSignOut,
    onLanguageChange,
    ...render(
      <UserMenu
        name="Robin Voorbeeld"
        email="robin@example.test"
        organization="Testbureau"
        labels={labels}
        languageName="Nederlands"
        onLanguageChange={onLanguageChange}
        onSignOut={onSignOut}
      />,
    ),
  };
}

it("follows the menu button pattern: open, arrow navigation, Escape returns focus", async () => {
  const { container } = setup();
  const trigger = screen.getByRole("button", { name: "Gebruikersmenu: Robin Voorbeeld, Testbureau" });
  expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
  await userEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByText("robin@example.test")).toBeTruthy();
  const menu = screen.getByRole("menu", { name: "Gebruikersmenu" });
  const items = [...menu.querySelectorAll<HTMLElement>("[role^=menuitem]")];
  expect(items.map((item) => item.textContent)).toEqual([
    "personMijn profielBinnenkort",
    "settingsInstellingenBinnenkort",
    "dark_modeDonkere modus",
    "languageTaalNederlandsunfold_more",
    "keyboardSneltoetsenBinnenkort",
    "helpHelp en supportBinnenkort",
    "logoutUitloggen",
  ]);
  expect(document.activeElement).toBe(items[0]);
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.keyboard("{ArrowUp}");
  expect(document.activeElement).toBe(items.at(-1));
  await userEvent.keyboard("{Home}{ArrowDown}");
  expect(document.activeElement).toBe(items[1]);
  await userEvent.keyboard("{End}");
  expect(document.activeElement).toBe(items.at(-1));
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

it("toggles dark mode, changes language and signs out", async () => {
  const { onSignOut, onLanguageChange } = setup();
  const trigger = screen.getByRole("button", { name: /Gebruikersmenu/ });
  trigger.focus();
  await userEvent.keyboard("{ArrowDown}");
  const dark = screen.getByRole("menuitemcheckbox", { name: "Donkere modus" });
  expect(dark.getAttribute("aria-checked")).toBe("false");
  await userEvent.click(dark);
  expect(dark.getAttribute("aria-checked")).toBe("true");
  expect(document.documentElement.dataset["theme"]).toBe("dark");
  await userEvent.click(screen.getByRole("menuitem", { name: /Taal/ }));
  expect(onLanguageChange).toHaveBeenCalledOnce();
  const profile = screen.getByRole("menuitem", { name: /Mijn profiel/ });
  expect(profile.getAttribute("aria-disabled")).toBe("true");
  await userEvent.click(profile);
  expect(screen.getByRole("menu")).toBeTruthy();
  screen.getByRole("menuitem", { name: "Uitloggen" }).focus();
  await userEvent.keyboard("{Enter}");
  expect(onSignOut).toHaveBeenCalledOnce();
  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

it("closes on Tab and on an outside click", async () => {
  setup();
  const trigger = screen.getByRole("button", { name: /Gebruikersmenu/ });
  await userEvent.click(trigger);
  await userEvent.tab();
  expect(screen.queryByRole("menu")).toBeNull();
  await userEvent.click(trigger);
  await userEvent.click(document.body);
  expect(screen.queryByRole("menu")).toBeNull();
});
