import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import userEvent from "@testing-library/user-event";
import css from "./calendar.css?raw";
import { Calendar } from "./Calendar.tsx";
import { demoStore } from "../../../demo/store.ts";
import { TaskList } from "../../dashboard/widgets/DashboardWidgets.tsx";
const cell = (name: RegExp) => screen.getByRole("gridcell", { name, hidden: true });
beforeEach(() => {
  demoStore.reset();
  window.history.replaceState(null, "", "/");
});
describe("appointment interactions", () => {
  it("opens details, edits in the same modal, creates a shared linked task and confirms deletion", async () => {
    render(
      <>
        <Calendar locale="nl-NL" />
        <TaskList locale="nl-NL" />
      </>,
    );
    const intake = screen.getAllByRole("button", { name: /Intake Dekker & Zonen/ })[0];
    if (!intake) throw new Error("Expected intake appointment");
    await userEvent.click(intake);
    const sheet = screen.getByRole("dialog");
    expect(sheet.classList.contains("ts-sheet")).toBe(true);
    expect(sheet.contains(document.activeElement)).toBe(true);
    expect(within(sheet).getByText("Eva Kuipers")).toBeDefined();
    await userEvent.click(within(sheet).getByRole("button", { name: "Taak maken" }));
    expect(screen.getAllByText("Voorbereiden: Intake Dekker & Zonen")).toHaveLength(2);
    await userEvent.click(within(sheet).getByRole("button", { name: "Bewerken" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.classList.contains("ts-sheet")).toBe(false);
    const title = within(dialog).getByLabelText(/Titel/);
    await userEvent.clear(title);
    await userEvent.type(title, "Synthetic edit");
    await userEvent.click(within(dialog).getByRole("button", { name: "Opslaan" }));
    const reopened = screen.getByRole("dialog");
    expect(reopened.classList.contains("ts-sheet")).toBe(true);
    expect(document.activeElement).toBe(within(reopened).getByRole("heading", { name: "Synthetic edit" }));
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Verwijderen" }));
    expect(demoStore.getSnapshot().events.some((event) => event.id === "ev-05")).toBe(true);
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Verwijderen bevestigen" }));
    expect(demoStore.getSnapshot().events.some((event) => event.id === "ev-05")).toBe(false);
  });
  it("creates from an empty slot with Enter and prefills the date/time for 30 minutes", async () => {
    render(<Calendar locale="nl-NL" />);
    await userEvent.click(screen.getByRole("radio", { name: "Dag" }));
    const slot = screen.getByRole("gridcell", { name: /vrijdag 30 oktober 2026, 11:15/ });
    fireEvent.keyDown(slot, { key: "Enter" });
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog)
        .getByLabelText(/Starttijd/)
        .getAttribute("value"),
    ).toBe("11:15");
    expect(
      within(dialog)
        .getByLabelText(/Eindtijd/)
        .getAttribute("value"),
    ).toBe("11:45");
    await userEvent.click(within(dialog).getByRole("switch", { name: "Hele dag" }));
    expect(within(dialog).queryByLabelText(/Starttijd/)).toBeNull();
  });
  it("moves a focused appointment with Alt+arrows and announces the new range", () => {
    render(<Calendar locale="nl-NL" />);
    const item = screen.getAllByRole("button", { name: /Intake Dekker & Zonen/ })[0];
    if (!item) throw new Error("Expected intake appointment");
    fireEvent.keyDown(item, { key: "ArrowDown", altKey: true });
    expect(demoStore.getSnapshot().events.find((event) => event.id === "ev-05")?.start).toBe("09:15");
    expect(screen.getByRole("status").textContent).toContain("09:15");
  });
});

it("creates from a double-click and shows conflicts only for required attendees", async () => {
  render(<Calendar locale="nl-NL" />);
  const day = screen.getByRole("gridcell", { name: /vrijdag 30 oktober 2026/ });
  fireEvent.doubleClick(day);
  const dialog = screen.getByRole("dialog", { name: "Nieuwe afspraak" });
  expect(
    within(dialog)
      .getByLabelText(/Startdatum/)
      .getAttribute("value"),
  ).toBe("2026-10-30");
  const attendees = within(dialog).getByRole("combobox", { name: "Deelnemers" });
  await userEvent.click(attendees);
  await userEvent.click(
    within(within(dialog).getByRole("listbox", { name: "Deelnemers" })).getByRole("option", { name: "Eva Kuipers" }),
  );
  expect(within(dialog).getByRole("note").textContent).toContain("Eva Kuipers");
  await userEvent.click(within(dialog).getByRole("switch", { name: "Eva Kuipers: Verplicht" }));
  expect(within(dialog).queryByRole("note")).toBeNull();
  expect(within(dialog).getByText("Optioneel")).toBeDefined();
});

it("moves with drag/drop, resizes in quarter-hour slots and exposes a keyboard move form", async () => {
  render(<Calendar locale="nl-NL" />);
  const dataTransfer = { setData: () => {}, effectAllowed: "move" };
  const item = screen.getAllByRole("button", { name: /09:00.*Intake Dekker & Zonen/ })[0];
  if (!item) throw new Error("Expected appointment");
  fireEvent.dragStart(item, { dataTransfer });
  fireEvent.drop(screen.getByRole("gridcell", { name: /zaterdag 31 oktober 2026/ }), { dataTransfer });
  expect(demoStore.getSnapshot().events.find((event) => event.id === "ev-05")?.date).toBe("2026-10-31");
  await userEvent.click(screen.getByRole("radio", { name: "Dag" }));
  fireEvent.dragStart(screen.getByRole("button", { name: "Eindtijd wijzigen voor Intake Dekker & Zonen" }), {
    dataTransfer,
  });
  fireEvent.drop(screen.getByRole("gridcell", { name: /zaterdag 31 oktober 2026, 10:30/ }), { dataTransfer });
  expect(demoStore.getSnapshot().events.find((event) => event.id === "ev-05")?.end).toBe("10:45");
  const actions = screen.getAllByRole("button", { name: "Acties voor Intake Dekker & Zonen" })[0];
  if (!actions) throw new Error("Expected actions menu");
  await userEvent.click(actions);
  await userEvent.click(screen.getByRole("menuitem", { name: "Verplaatsen" }));
  expect(screen.getByRole("dialog", { name: "Verplaatsen" })).toBeDefined();
  expect(
    within(screen.getByRole("dialog"))
      .getByLabelText(/Eindtijd/)
      .getAttribute("value"),
  ).toBe("10:45");
});

it("keeps the day grid and form accessible with a single roving slot", async () => {
  const { container } = render(<Calendar locale="en-GB" />);
  await userEvent.click(screen.getByRole("radio", { name: "Day" }));
  const grid = screen.getByRole("grid");
  expect(within(grid).getAllByRole("gridcell")).toHaveLength(97);
  expect(grid.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
  const first = grid.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]');
  if (!first) throw new Error("Expected selected slot");
  first.focus();
  await userEvent.keyboard("{ArrowDown}{Enter}");
  const dialog = screen.getByRole("dialog", { name: "New appointment" });
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
  await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
  expect(within(dialog).getByRole("region", { name: "Check the following fields" })).toBe(document.activeElement);
});

describe("agenda refinements", () => {
  it("returns focus to the appointment when the details sheet closes", async () => {
    render(<Calendar locale="nl-NL" />);
    const intake = screen.getAllByRole("button", { name: /Intake Dekker & Zonen/ })[0];
    if (!intake) throw new Error("Expected intake appointment");
    intake.focus();
    await userEvent.click(intake);
    const [closeButton] = within(screen.getByRole("dialog")).getAllByRole("button", { name: "Sluiten" });
    if (!closeButton) throw new Error("Expected close button");
    await userEvent.click(closeButton);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.activeElement).toBe(intake);
  });
  it("never underlines appointments or days", () => {
    expect(css).not.toMatch(/text-decoration:\s*underline/);
  });
  it("highlights the drop target during drag and clears it on leave, drop and cancel", () => {
    render(<Calendar locale="nl-NL" />);
    const dataTransfer = { setData: () => {}, effectAllowed: "move" };
    const item = screen.getAllByRole("button", { name: /09:00.*Intake Dekker & Zonen/ })[0];
    if (!item) throw new Error("Expected appointment");
    const target = screen.getByRole("gridcell", { name: /donderdag 29 oktober 2026/ });
    const other = screen.getByRole("gridcell", { name: /zaterdag 31 oktober 2026/ });
    fireEvent.dragStart(item, { dataTransfer });
    fireEvent.dragEnter(target, { dataTransfer });
    expect(target.hasAttribute("data-drop-target")).toBe(true);
    expect(target.getAttribute("aria-describedby")).not.toBe(item.getAttribute("aria-describedby"));
    fireEvent.dragEnter(other, { dataTransfer });
    expect(target.hasAttribute("data-drop-target")).toBe(false);
    expect(other.hasAttribute("data-drop-target")).toBe(true);
    fireEvent.dragLeave(other, { dataTransfer, relatedTarget: document.body });
    expect(other.hasAttribute("data-drop-target")).toBe(false);
    fireEvent.dragEnter(target, { dataTransfer });
    fireEvent.dragEnd(item, { dataTransfer });
    expect(document.querySelector("[data-drop-target]")).toBeNull();
    fireEvent.dragStart(item, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    expect(document.querySelector("[data-drop-target]")).toBeNull();
  });
  it("highlights the chosen target for the keyboard move and the move form", async () => {
    render(<Calendar locale="nl-NL" />);
    const item = screen.getAllByRole("button", { name: /Intake Dekker & Zonen/ })[0];
    if (!item) throw new Error("Expected appointment");
    fireEvent.keyDown(item, { key: "ArrowRight", altKey: true });
    expect(screen.getByRole("gridcell", { name: /zaterdag 31 oktober 2026/ }).hasAttribute("data-drop-target")).toBe(
      true,
    );
    expect(screen.getByRole("status").textContent).toContain("31 oktober");
  });
  it("shows the chosen target of the move form in the grid", async () => {
    render(<Calendar locale="nl-NL" />);
    const actions = screen.getAllByRole("button", { name: "Acties voor Intake Dekker & Zonen" })[0];
    if (!actions) throw new Error("Expected actions menu");
    await userEvent.click(actions);
    await userEvent.click(screen.getByRole("menuitem", { name: "Verplaatsen" }));
    expect(cell(/vrijdag 30 oktober 2026/).hasAttribute("data-drop-target")).toBe(true);
    const date = within(screen.getByRole("dialog")).getByLabelText(/Startdatum/);
    fireEvent.change(date, { target: { value: "2026-10-29" } });
    expect(cell(/donderdag 29 oktober 2026/).hasAttribute("data-drop-target")).toBe(true);
    expect(cell(/vrijdag 30 oktober 2026/).hasAttribute("data-drop-target")).toBe(false);
  });
  it("switches between own, colleague and shared agendas and stores a member id in the URL", async () => {
    render(<Calendar locale="nl-NL" />);
    const selector = screen.getByRole("combobox", { name: "Agenda" });
    expect(screen.queryByText("Gesprek Joris van den Berg")).toBeNull();
    await userEvent.selectOptions(selector, "u-ruben");
    expect(window.location.search).toBe("?agenda=u-ruben");
    expect(window.location.search).not.toMatch(/Ruben/);
    expect(screen.queryByText("Intake Dekker & Zonen")).toBeNull();
    await userEvent.selectOptions(selector, "shared");
    expect(window.location.search).toBe("?agenda=shared");
    expect(screen.getAllByText("Intake Dekker & Zonen").length).toBeGreaterThan(0);
    const people = screen.getByRole("group", { name: "Collega's tonen" });
    await userEvent.click(within(people).getByRole("checkbox", { name: "Eva Kuipers" }));
    expect(screen.queryByText("Intake Dekker & Zonen")).toBeNull();
    await userEvent.selectOptions(selector, "me");
    expect(window.location.search).toBe("");
    expect(screen.getAllByText("Intake Dekker & Zonen").length).toBeGreaterThan(0);
  });
  it("restores a colleague agenda from the URL in every view", async () => {
    window.history.replaceState(null, "", "/?agenda=u-ruben");
    render(<Calendar locale="nl-NL" />);
    expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Agenda" }).value).toBe("u-ruben");
    await userEvent.click(screen.getByRole("radio", { name: "Week" }));
    expect(screen.getAllByText("Bezet").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("radio", { name: "Dag" }));
    expect(screen.getByRole("grid")).toBeDefined();
  });
  it("renders private appointments of others as busy only, without title or details in the DOM", async () => {
    const template = demoStore.getSnapshot().events.find((event) => event.id === "ev-05");
    if (!template) throw new Error("Expected template appointment");
    demoStore.save({
      ...template,
      id: "secret",
      title: "Synthetic secret",
      description: "Synthetic secret details",
      location: "Synthetic secret place",
      date: "2026-10-30",
      start: "16:00",
      end: "17:00",
      organiser: "u-ruben",
      attendees: [{ userId: "u-ruben", required: true }],
      private: true,
    });
    const { container } = render(<Calendar locale="nl-NL" />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Agenda" }), "u-ruben");
    expect(screen.getAllByText("Bezet").length).toBeGreaterThan(0);
    expect(container.innerHTML).not.toContain("Synthetic secret");
    const busy = screen.getAllByText("Bezet")[0];
    if (!busy) throw new Error("Expected busy block");
    await userEvent.click(busy);
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Agenda" }), "shared");
    expect(container.innerHTML).not.toContain("Synthetic secret");
  });
  it("labels the agenda selector and legend in English", async () => {
    render(<Calendar locale="en-GB" />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Agenda" }), "shared");
    expect(screen.getByRole("group", { name: "Show colleagues" })).toBeDefined();
  });
});
