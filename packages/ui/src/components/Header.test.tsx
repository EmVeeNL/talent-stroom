import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { CommandPalette } from "./CommandPalette.tsx";
import { Header } from "./Header.tsx";
import { LanguageMenu, NavbarIconButton, NavbarSearch, ThemeButton } from "./Navbar.tsx";

// jsdom has no native dialog implementation.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset["theme"];
});

it("exposes banner and slots", async () => {
  const { container } = render(
    <Header
      search={<button>Zoeken</button>}
      notifications={<button>Meldingen</button>}
      userMenu={<button>Profiel</button>}
    />,
  );
  expect(screen.getByRole("banner")).toBeTruthy();
  expect(screen.getAllByRole("button")).toHaveLength(3);
  expect(await axeViolations(container)).toEqual([]);
});

it("labels icon-only buttons, opens the command palette from the search field and toggles dark mode", async () => {
  const { container } = render(
    <Header
      search={
        <CommandPalette
          label="Zoeken"
          triggerLabel="Zoeken"
          closeLabel="Sluiten"
          emptyLabel="Geen resultaten"
          actions={[{ id: "a", label: "Kandidaten", group: "Pagina's", onSelect: () => undefined }]}
          renderTrigger={(props) => <NavbarSearch {...props} placeholder="Zoek kandidaten, vacatures…" />}
        />
      }
      notifications={<NavbarIconButton icon="notifications" label="Meldingen, 2 ongelezen" dot />}
    >
      <ThemeButton label="Donkere modus" />
      <NavbarIconButton icon="help" label="Help" />
    </Header>,
  );
  for (const button of screen.getAllByRole("button"))
    expect(button.getAttribute("aria-label") ?? button.textContent).toBeTruthy();
  const search = screen.getByRole("button", { name: /Zoek kandidaten/ });
  expect(search.getAttribute("aria-keyshortcuts")).toBe("Control+K Meta+K");
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.click(search);
  expect(search.getAttribute("aria-expanded")).toBe("true");
  await userEvent.keyboard("{Escape}");
  expect(document.activeElement).toBe(search);
  const theme = screen.getByRole("button", { name: "Donkere modus" });
  expect(theme.getAttribute("aria-pressed")).toBe("false");
  await userEvent.click(theme);
  expect(theme.getAttribute("aria-pressed")).toBe("true");
  expect(document.documentElement.dataset["theme"]).toBe("dark");
});

it("switches language through a menu button with radio items", async () => {
  let value = "nl-NL";
  const options = [
    { value: "nl-NL", label: "Nederlands", short: "NL" },
    { value: "en-GB", label: "English", short: "EN" },
  ];
  const { container } = render(
    <LanguageMenu label="Taal" value={value} options={options} onChange={(next) => (value = next)} />,
  );
  const trigger = screen.getByRole("button", { name: "Taal: Nederlands" });
  trigger.focus();
  await userEvent.keyboard("{ArrowDown}");
  const items = screen.getAllByRole("menuitemradio");
  expect(document.activeElement).toBe(items[0]);
  expect(items[0]?.getAttribute("aria-checked")).toBe("true");
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.keyboard("{ArrowDown}{Enter}");
  expect(value).toBe("en-GB");
  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
