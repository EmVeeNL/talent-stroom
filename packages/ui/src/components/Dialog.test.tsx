import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Dialog } from "./Dialog.tsx";
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
it("labels its modal, sets initial focus, closes on cancel and restores trigger focus", async () => {
  const { container } = render(
    <Dialog title="Voorbeeld" triggerLabel="Open" closeLabel="Sluiten">
      <input aria-label="Naam" />
    </Dialog>,
  );
  expect(await axeViolations(container)).toEqual([]);
  const trigger = screen.getByRole("button", { name: "Open" });
  await userEvent.click(trigger);
  const dialog = screen.getByRole("dialog");
  expect(dialog.contains(document.activeElement)).toBe(true);

  expect(await axeViolations(container)).toEqual([]);
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
  expect(document.activeElement).toBe(trigger);
  expect(dialog.hasAttribute("open")).toBe(false);
});
