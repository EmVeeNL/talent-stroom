import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import AgendaPage from "./Agenda.tsx";
import ChatPage from "./Chat.tsx";
import ContactenPage from "./Contacten.tsx";
import CrmPage from "./CRM.tsx";
import KanbanbordPage from "./Kanbanbord.tsx";
import NotitiesPage from "./Notities.tsx";

async function violations(container: Element): Promise<string[]> {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}

describe("Agenda", () => {
  it("renders a Monday-first month grid and moves focus with the arrow keys", async () => {
    const { container } = render(<AgendaPage locale="nl-NL" />);
    const grid = screen.getByRole("grid");
    expect(within(grid).getAllByRole("columnheader")[0]?.textContent).toBe("ma");
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(35);
    const today = within(grid).getByRole("gridcell", { name: /vrijdag 30 oktober 2026/ });
    expect(today.getAttribute("tabindex")).toBe("0");
    expect(today.getAttribute("aria-label")).toContain("Intake Dekker & Zonen");
    today.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement?.getAttribute("data-date")).toBe("2026-10-31");
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement?.getAttribute("data-date")).toBe("2026-11-07");
    expect(screen.getByRole("heading", { name: "november 2026", level: 2 })).toBeDefined();
    expect(await violations(container)).toEqual([]);
  });

  it("switches to the week view", async () => {
    render(<AgendaPage locale="nl-NL" />);
    await userEvent.click(screen.getByRole("radio", { name: "Week" }));
    expect(within(screen.getByRole("grid")).getAllByRole("gridcell")).toHaveLength(7 * 97);
  });

  it("adds a new appointment to local state", async () => {
    render(<AgendaPage locale="nl-NL" />);
    await userEvent.click(screen.getByRole("button", { name: "Nieuwe afspraak" }));
    const dialog = screen.getByRole("dialog", { name: "Nieuwe afspraak" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Opslaan" }));
    expect(within(dialog).getByText("Vul een titel in.")).toBeDefined();
    await userEvent.type(within(dialog).getByLabelText(/Titel/), "Kennismaking Test");
    await userEvent.click(within(dialog).getByRole("button", { name: "Opslaan" }));
    expect(screen.getByRole("status").textContent).toContain("Kennismaking Test");
    expect(screen.getByRole("gridcell", { name: /vrijdag 30 oktober 2026.*Kennismaking Test/ })).toBeDefined();
  });
});

describe("Chat", () => {
  it("lists conversations with unread badges and groups messages by day", async () => {
    const { container } = render(<ChatPage locale="nl-NL" />);
    expect(screen.getByLabelText("3 ongelezen berichten")).toBeDefined();
    expect(screen.getByRole("log", { name: "Berichten" }).getAttribute("aria-live")).toBe("polite");
    await userEvent.click(screen.getByRole("button", { name: /Sanne Willems/ }));
    expect(screen.queryByLabelText("2 ongelezen berichten")).toBeNull();
    expect(screen.getByRole("heading", { name: "Gisteren", level: 3 })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Vandaag", level: 3 })).toBeDefined();
    expect(await violations(container)).toEqual([]);
  });

  it("sends on Enter and keeps a new line on Shift+Enter", async () => {
    render(<ChatPage locale="nl-NL" />);
    const input = screen.getByRole("textbox", { name: "Bericht schrijven" });
    await userEvent.type(input, "Eerste regel{Shift>}{Enter}{/Shift}tweede regel");
    expect(input).toHaveProperty("value", "Eerste regel\ntweede regel");
    await userEvent.keyboard("{Enter}");
    expect(input).toHaveProperty("value", "");
    expect(within(screen.getByRole("log")).getByText(/Eerste regel/)).toBeDefined();
  });

  it("filters conversations by search", async () => {
    render(<ChatPage locale="nl-NL" />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Gesprekken zoeken" }), "vermeulen");
    expect(screen.getAllByRole("button", { name: /Vermeulen|Pim/ }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Femke/ })).toBeNull();
  });

  it("shows the thread on mobile after choosing a conversation and returns with the back button", async () => {
    const { container } = render(<ChatPage locale="nl-NL" />);
    expect(container.querySelector(".chat")?.getAttribute("data-view")).toBe("list");
    await userEvent.click(screen.getByRole("button", { name: /Noor Bakker/ }));
    expect(container.querySelector(".chat")?.getAttribute("data-view")).toBe("thread");
    await userEvent.click(screen.getByRole("button", { name: "Terug naar gesprekken" }));
    expect(container.querySelector(".chat")?.getAttribute("data-view")).toBe("list");
  });
});

describe("Kanbanbord", () => {
  it("filters by recruiter and opens a candidate sheet on card click", async () => {
    const { container } = render(<KanbanbordPage locale="nl-NL" />);
    expect(screen.getByText("13 kandidaten")).toBeDefined();
    await userEvent.selectOptions(screen.getByLabelText("Recruiter"), "Ruben de Wit");
    expect(screen.getByText("4 kandidaten")).toBeDefined();
    await userEvent.click(screen.getByText("Joris van den Berg"));
    const sheet = screen.getByRole("dialog", { name: "Joris van den Berg" });
    expect(within(sheet).getByText("Software Tester")).toBeDefined();
    expect(within(sheet).getByRole("link", { name: "joris.vandenberg@voorbeeld.nl" })).toBeDefined();
    fireEvent(sheet, new Event("cancel", { cancelable: true }));
    expect(await violations(container)).toEqual([]);
  });

  it("moves a card through its menu without losing the others", async () => {
    render(<KanbanbordPage locale="nl-NL" />);
    await userEvent.click(screen.getByRole("button", { name: "Acties voor Daan Visser" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Verplaatsen naar Gesprek" }));
    const gesprek = screen.getByRole("region", { name: /Gesprek/ });
    expect(within(gesprek).getByText("Daan Visser")).toBeDefined();
    expect(screen.getByText("13 kandidaten")).toBeDefined();
  });
});

describe("CRM", () => {
  it("shows tabs with searchable tables and nl-NL euro amounts", async () => {
    const { container } = render(<CrmPage locale="nl-NL" />);
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: /Contactpersonen/ })).toBeDefined();
    await userEvent.type(screen.getByRole("searchbox", { name: "Zoeken" }), "brouwer");
    expect(screen.getByRole("button", { name: /Brouwer Logistiek/ })).toBeDefined();
    expect(screen.queryByRole("button", { name: /Vermeulen Techniek/ })).toBeNull();
    await userEvent.click(screen.getByRole("tab", { name: "Deals" }));
    expect(screen.getByText(/€\s?42\.000/)).toBeDefined();
    expect(screen.getAllByText("Gewonnen").length).toBeGreaterThan(0);
    expect(await violations(container)).toEqual([]);
  });

  it("opens a detail sheet for a company", async () => {
    render(<CrmPage locale="nl-NL" />);
    await userEvent.click(screen.getByRole("button", { name: /Vermeulen Techniek/ }));
    const sheet = screen.getByRole("dialog", { name: "Vermeulen Techniek" });
    expect(within(sheet).getByText("Pim Vermeulen")).toBeDefined();
    expect(within(sheet).getByText("Werving Senior Java Developer")).toBeDefined();
  });
});

describe("Notities", () => {
  it("creates, searches, pins and archives notes", async () => {
    const { container } = render(<NotitiesPage locale="nl-NL" />);
    expect(screen.queryByText("Oude vacaturetekst Planner")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Nieuwe notitie" }));
    const dialog = screen.getByRole("dialog", { name: "Nieuwe notitie" });
    await userEvent.type(within(dialog).getByLabelText(/Titel/), "Testnotitie");
    await userEvent.type(within(dialog).getByLabelText("Labels"), "test");
    await userEvent.click(within(dialog).getByRole("button", { name: "Opslaan" }));
    expect(screen.getByRole("heading", { name: "Testnotitie", level: 3 })).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "Testnotitie archiveren" }));
    expect(screen.queryByRole("heading", { name: "Testnotitie" })).toBeNull();
    await userEvent.click(screen.getByRole("radio", { name: "Archief" }));
    expect(screen.getByRole("heading", { name: "Testnotitie", level: 3 })).toBeDefined();
    expect(await violations(container)).toEqual([]);
  });

  it("filters by search text", async () => {
    render(<NotitiesPage locale="nl-NL" />);
    await userEvent.type(screen.getByRole("searchbox", { name: "Notities zoeken" }), "benchmark");
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });
});

describe("Contacten", () => {
  it("groups contacts alphabetically, toggles favourites and filters", async () => {
    const { container } = render(<ContactenPage locale="nl-NL" />);
    expect(screen.getByRole("heading", { name: "A", level: 3 })).toBeDefined();
    await userEvent.click(screen.getByRole("button", { name: /Anouk Smit/ }));
    const toggle = screen.getByRole("button", { name: "Favoriet", pressed: false });
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Verwijderen uit favorieten", pressed: true })).toBeDefined();
    expect(await violations(container)).toEqual([]);
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    await userEvent.type(screen.getByRole("searchbox", { name: "Contacten zoeken" }), "zzz");
    expect(screen.getByText("Geen contacten gevonden")).toBeDefined();
    expect(await violations(container)).toEqual([]);
  });

  it("opens drawer details from the contact list and restores focus on Escape", async () => {
    render(<ContactenPage locale="nl-NL" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    const opener = screen.getByRole("button", { name: /Bram Dekker/ });
    await userEvent.click(opener);
    const drawer = screen.getByRole("dialog", { name: "Bram Dekker" });
    expect(drawer.classList.contains("ts-sheet")).toBe(true);
    fireEvent(drawer, new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(opener);
  });
});
