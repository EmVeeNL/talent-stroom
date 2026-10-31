import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import userEvent from "@testing-library/user-event";
import { Calendar } from "./Calendar.tsx";
import { demoStore } from "../../../demo/store.ts";
import { TaskList } from "../../dashboard/widgets/DashboardWidgets.tsx";
beforeEach(() => demoStore.reset());
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
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Eva Kuipers")).toBeDefined();
    await userEvent.click(within(dialog).getByRole("button", { name: "Taak maken" }));
    expect(screen.getAllByText("Voorbereiden: Intake Dekker & Zonen")).toHaveLength(2);
    await userEvent.click(within(dialog).getByRole("button", { name: "Bewerken" }));
    const title = within(dialog).getByLabelText(/Titel/);
    await userEvent.clear(title);
    await userEvent.type(title, "Synthetic edit");
    await userEvent.click(within(dialog).getByRole("button", { name: "Opslaan" }));
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(document.activeElement).toBe(within(dialog).getByRole("heading", { name: "Synthetic edit" }));
    expect(within(dialog).getByRole("heading", { name: "Synthetic edit" })).toBeDefined();
    await userEvent.click(within(dialog).getByRole("button", { name: "Verwijderen" }));
    expect(demoStore.getSnapshot().events.some((event) => event.id === "ev-05")).toBe(true);
    await userEvent.click(within(dialog).getByRole("button", { name: "Verwijderen bevestigen" }));
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
