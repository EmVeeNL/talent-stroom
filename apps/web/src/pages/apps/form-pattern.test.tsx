import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { ContactsApp } from "./contacten/ContactsApp.tsx";
import { CrmApp } from "./crm/CrmApp.tsx";
import { NotesApp } from "./notities/NotesApp.tsx";
import { KanbanApp } from "./kanban/KanbanApp.tsx";
import { CRM_COMPANIES, DEMO_CONTACTS, DEMO_NOTES, PIPELINE_CANDIDATES } from "../../demo/apps.ts";

it.each([
  ["contacts", ContactsApp, DEMO_CONTACTS[0]?.name],
  ["crm", CrmApp, CRM_COMPANIES[0]?.name],
  ["kanban", KanbanApp, PIPELINE_CANDIDATES[0]?.name],
] as const)("%s opens drawer details and saves edits from a schema-backed modal", async (_name, App, name) => {
  if (!name) throw new Error("Missing synthetic fixture");
  render(<App locale="nl-NL" />);
  await userEvent.click(required(screen.getAllByText(name)[0]));
  const drawer = screen.getByRole("dialog");
  expect(drawer.classList.contains("ts-sheet")).toBe(true);
  await userEvent.click(within(drawer).getByRole("button", { name: "Bewerken" }));
  const form = screen.getAllByRole("dialog").find((el) => !el.classList.contains("ts-sheet"));
  const input = within(required(form)).getByRole("textbox", { name: /Naam|Titel/ });
  await userEvent.clear(input);
  await userEvent.click(within(required(form)).getByRole("button", { name: "Opslaan" }));
  expect(within(required(form)).getByRole("alert")).toBeTruthy();
  await userEvent.type(input, "Synthetisch gewijzigd");
  await userEvent.click(within(required(form)).getByRole("button", { name: "Opslaan" }));
  expect(within(screen.getByRole("dialog")).getByRole("heading", { name: "Synthetisch gewijzigd" })).toBeTruthy();
});

it("notes opens details before editing and protects unsaved changes", async () => {
  render(<NotesApp locale="nl-NL" />);
  await userEvent.click(screen.getByRole("button", { name: required(DEMO_NOTES[0]).title }));
  await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Bewerken" }));
  const form = screen.getAllByRole("dialog").find((el) => !el.classList.contains("ts-sheet"));
  await userEvent.type(within(required(form)).getByRole("textbox", { name: /Titel/ }), " gewijzigd");
  await userEvent.click(within(required(form)).getByRole("button", { name: "Annuleren" }));
  expect(screen.getByRole("alertdialog")).toBeTruthy();
  await userEvent.click(screen.getByRole("button", { name: "Verwerpen" }));
  expect(within(screen.getByRole("dialog")).getByRole("heading", { name: required(DEMO_NOTES[0]).title })).toBeTruthy();
});

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing fixture or element");
  return value;
}
