import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { AppShell, PageHeader } from "./AppShell.tsx";
import { SidebarAssistant } from "./Sidebar.tsx";

const labels = {
  collapse: "Zijbalk inklappen",
  expand: "Zijbalk uitklappen",
  openMenu: "Menu openen",
  closeMenu: "Menu sluiten",
  skipToContent: "Naar hoofdinhoud",
};
function shell(props: { mobile?: boolean } = {}) {
  return render(
    <AppShell
      {...props}
      labels={labels}
      sidebar={{
        label: "Hoofdnavigatie",
        soonLabel: "Binnenkort",
        home: { href: "/", label: "TalentStroom" },
        activeId: "dashboard",
        sections: [
          {
            id: "top",
            items: [
              { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/" },
              { id: "tasks", label: "Taken", icon: "task_alt", href: "#taken" },
            ],
          },
        ],
        footer: <SidebarAssistant title="AI Assistent" description="Stel een vraag…" soonLabel="Binnenkort" />,
      }}
      header={{ search: <button type="button">Zoeken</button> }}
    >
      <PageHeader title="Goedemiddag" subtitle="Overzicht" actions={<button type="button">Nieuw</button>} />
    </AppShell>,
  );
}
afterEach(() => vi.unstubAllGlobals());

it("collapses and expands the sidebar with the keyboard and keeps aria-current", async () => {
  const { container } = shell();
  const toggle = screen.getByRole("button", { name: "Zijbalk inklappen" });
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("heading", { level: 1, name: "Goedemiddag" })).toBeTruthy();
  expect(screen.getByRole("main")).toBeTruthy();
  expect(await axeViolations(container)).toEqual([]);
  toggle.focus();
  await userEvent.keyboard("{Enter}");
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(toggle.getAttribute("aria-label")).toBe("Zijbalk uitklappen");
  expect(container.querySelector(".ts-sidebar--collapsed")).toBeTruthy();
  // Names stay available in the icon-only rail.
  expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("aria-current")).toBe("page");
  expect(document.activeElement).toBe(toggle);
  await userEvent.keyboard(" ");
  expect(toggle.getAttribute("aria-label")).toBe("Zijbalk inklappen");
  expect(container.querySelector(".ts-sidebar--collapsed")).toBeNull();
});

it("opens a mobile drawer that traps focus and closes with Escape", async () => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width"),
    addEventListener() {},
    removeEventListener() {},
  }));
  const { container } = shell();
  expect(screen.queryByRole("navigation")).toBeNull();
  const toggle = screen.getByRole("button", { name: "Menu openen" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  toggle.focus();
  await userEvent.keyboard("{Enter}");
  const drawer = screen.getByRole("dialog", { name: "Hoofdnavigatie" });
  expect(drawer.getAttribute("aria-modal")).toBe("true");
  expect(container.querySelector(".ts-app-shell__body")?.hasAttribute("inert")).toBe(true);
  const home = screen.getByRole("link", { name: "TalentStroom" });
  expect(document.activeElement).toBe(home);
  await userEvent.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: /AI Assistent/ }));
  await userEvent.tab();
  expect(document.activeElement).toBe(home);
  await userEvent.tab();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Menu sluiten" }));
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(toggle);
  expect(container.querySelector(".ts-app-shell__body")?.hasAttribute("inert")).toBe(false);
  await userEvent.click(toggle);
  await userEvent.click(screen.getByRole("button", { name: "Menu sluiten" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(toggle);
});
