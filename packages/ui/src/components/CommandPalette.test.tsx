import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { CommandPalette } from "./CommandPalette.tsx";
// jsdom has no native dialog implementation; browser focus trapping is supplied by showModal.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
it("opens with shortcut, filters, navigates, runs and restores focus", async () => {
  const run = vi.fn<() => void>();
  const { container } = render(
    <CommandPalette
      label="Zoeken"
      triggerLabel="Open zoeken"
      closeLabel="Sluiten"
      emptyLabel="Geen resultaten"
      actions={[
        { id: "a", label: "Kandidaten", group: "Pagina’s", onSelect: run },
        { id: "b", label: "Vacatures", group: "Pagina’s", onSelect: run },
      ]}
    />,
  );
  const trigger = screen.getByRole("button", { name: /Open zoeken/ });
  trigger.focus();
  await userEvent.keyboard("{Control>}k{/Control}");
  const input = screen.getByRole("combobox");
  expect(document.activeElement).toBe(input);
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.keyboard("{ArrowDown}{Home}{End}");
  expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Vacatures" }).id);
  await userEvent.type(input, "kand");
  expect(screen.getAllByRole("option")).toHaveLength(1);
  await userEvent.keyboard("{Enter}");
  expect(run).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(trigger);
  await userEvent.click(trigger);
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(trigger);
  await userEvent.click(trigger);
  await userEvent.type(screen.getByRole("combobox"), "zzzz");
  expect(screen.getByRole("status").textContent).toBe("Geen resultaten");
  expect(await axeViolations(container)).toEqual([]);
});
it("supports Cmd+K, grouped arrow wrapping, pointer selection and close button", async () => {
  const run = vi.fn<() => void>();
  const { container } = render(
    <CommandPalette
      label="Zoeken"
      triggerLabel="Open zoeken"
      closeLabel="Sluiten"
      emptyLabel="Geen resultaten"
      actions={[
        { id: "a", label: "Kandidaten", group: "Pagina’s", onSelect: run },
        { id: "b", label: "Toevoegen", group: "Acties", onSelect: run },
      ]}
    />,
  );
  await userEvent.keyboard("{Meta>}k{/Meta}");
  const input = screen.getByRole("combobox");
  await userEvent.keyboard("{ArrowUp}");
  expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Toevoegen" }).id);
  await userEvent.keyboard("{ArrowDown}");
  expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Kandidaten" }).id);
  expect(screen.getAllByRole("group")).toHaveLength(2);
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.click(screen.getByRole("option", { name: "Toevoegen" }));
  expect(run).toHaveBeenCalledOnce();
  await userEvent.click(screen.getByRole("button", { name: /Open zoeken/ }));
  await userEvent.click(screen.getByRole("button", { name: "Sluiten" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
