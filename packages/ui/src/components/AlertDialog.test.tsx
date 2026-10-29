import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { AlertDialog } from "./AlertDialog.tsx";
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
it("labels its modal, sets initial focus, closes on cancel and restores trigger focus", async () => {
  const { container } = render(
    <AlertDialog
      title="Voorbeeld"
      triggerLabel="Open"
      confirmLabel="Verwijderen"
      cancelLabel="Annuleren"
      onConfirm={() => {}}
    ></AlertDialog>,
  );
  expect(await axeViolations(container)).toEqual([]);
  const trigger = screen.getByRole("button", { name: "Open" });
  await userEvent.click(trigger);
  const dialog = screen.getByRole("alertdialog");
  expect(dialog.contains(document.activeElement)).toBe(true);
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Annuleren" }));
  expect(await axeViolations(container)).toEqual([]);
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(document.activeElement).toBe(trigger);
  expect(dialog.hasAttribute("open")).toBe(false);
});
it("requires an explicit confirmation and lets keyboard users cancel safely", async () => {
  let confirmed = 0;
  const { container } = render(
    <AlertDialog
      title="Kandidaat verwijderen?"
      triggerLabel="Open"
      confirmLabel="Verwijderen"
      cancelLabel="Annuleren"
      onConfirm={() => {
        confirmed++;
      }}
    >
      Dit verwijdert het demoprofiel.
    </AlertDialog>,
  );
  const trigger = screen.getByRole("button", { name: "Open" });
  await userEvent.click(trigger);
  await userEvent.keyboard("{Enter}");
  expect(confirmed).toBe(0);
  expect(screen.queryByRole("alertdialog")).toBeNull();
  await userEvent.click(trigger);
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.tab();
  await userEvent.keyboard("{Enter}");
  expect(confirmed).toBe(1);
  expect(document.activeElement).toBe(trigger);
});
