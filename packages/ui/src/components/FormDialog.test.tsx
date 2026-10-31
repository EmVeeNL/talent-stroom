import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { FormDialog } from "./FormDialog.tsx";
import { DetailDrawer } from "./DetailDrawer.tsx";

HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
const labels = {
  cancel: "Annuleren",
  save: "Opslaan",
  discardTitle: "Wijzigingen verwerpen?",
  discardBody: "Niet opgeslagen wijzigingen gaan verloren.",
  keepEditing: "Verder bewerken",
  discard: "Verwerpen",
};

it("guards Escape and cancel on dirty forms, focuses the safe action, and discards only after confirmation", async () => {
  const changed = vi.fn<(open: boolean) => void>();
  render(
    <FormDialog
      title="Bewerken"
      triggerLabel="Open"
      closeLabel="Sluiten"
      dirty
      labels={labels}
      formId="example"
      onOpenChange={changed}
    >
      <form id="example">
        <input aria-label="Titel" />
      </form>
    </FormDialog>,
  );
  const trigger = screen.getByRole("button", { name: "Open" });
  await userEvent.click(trigger);
  expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Titel" }));
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
  expect(screen.getByRole("alertdialog")).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Verder bewerken" }));
  await userEvent.click(screen.getByRole("button", { name: "Verder bewerken" }));
  expect(screen.queryByRole("alertdialog")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Annuleren" }));
  await userEvent.click(screen.getByRole("button", { name: "Verwerpen" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(changed).toHaveBeenLastCalledWith(false);
  expect(document.activeElement).toBe(trigger);
});

it("submits through the linked form and closes pristine forms without a prompt", async () => {
  const submit = vi.fn<(event: React.SubmitEvent) => void>((event) => event.preventDefault());
  render(
    <FormDialog title="Nieuw" triggerLabel="Open" closeLabel="Sluiten" labels={labels} formId="example">
      <form id="example" onSubmit={submit}>
        <input aria-label="Titel" />
      </form>
    </FormDialog>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Open" }));
  await userEvent.click(screen.getByRole("button", { name: "Opslaan" }));
  expect(submit).toHaveBeenCalledOnce();
  await userEvent.click(screen.getByRole("button", { name: "Sluiten" }));
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("composes drawer tabs and edit actions with keyboard navigation", async () => {
  const edit = vi.fn<() => void>();
  render(
    <DetailDrawer
      title="Voorbeeld"
      triggerLabel="Details"
      closeLabel="Sluiten"
      editLabel="Bewerken"
      onEdit={edit}
      tabs={{
        label: "Details",
        tabs: [
          { id: "info", label: "Informatie", panel: "Feiten" },
          { id: "activity", label: "Activiteit", panel: "Geschiedenis" },
        ],
      }}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Details" }));
  expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Voorbeeld" }));
  await userEvent.click(screen.getByRole("tab", { name: "Informatie" }));
  await userEvent.keyboard("{ArrowRight}");
  expect(screen.getByRole("tab", { name: "Activiteit" }).getAttribute("aria-selected")).toBe("true");
  await userEvent.click(screen.getByRole("button", { name: "Bewerken" }));
  expect(edit).toHaveBeenCalledOnce();
});

it("ignores a queued native close event after a modal has reopened (StrictMode)", () => {
  const changed = vi.fn<(open: boolean) => void>();
  render(
    <FormDialog title="Bewerken" triggerLabel="Open" closeLabel="Sluiten" open onOpenChange={changed}>
      <input aria-label="Titel" />
    </FormDialog>,
  );
  // Native close events are asynchronous; a StrictMode cleanup may have queued
  // one before the effect reopened the element.
  fireEvent(screen.getByRole("dialog"), new Event("close"));
  expect(changed).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeTruthy();
});

it("keeps a submitting form open and disables duplicate submit and cancel", async () => {
  const changed = vi.fn<(open: boolean) => void>();
  render(
    <FormDialog
      title="Bewerken"
      triggerLabel="Open"
      closeLabel="Sluiten"
      open
      submitting
      labels={labels}
      formId="pending"
      onOpenChange={changed}
    >
      <form id="pending">
        <input aria-label="Titel" />
      </form>
    </FormDialog>,
  );
  expect(screen.getByRole("button", { name: "Opslaan" }).hasAttribute("disabled")).toBe(true);
  expect(screen.getByRole("button", { name: "Annuleren" }).hasAttribute("disabled")).toBe(true);
  await userEvent.click(screen.getByRole("button", { name: "Sluiten" }));
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
  expect(changed).not.toHaveBeenCalled();
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

it("starts a reopened controlled edit session without a stale discard prompt", async () => {
  const props = { title: "Bewerken", triggerLabel: "Open", closeLabel: "Sluiten", dirty: true, labels };
  const { rerender } = render(<FormDialog {...props} open />);
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
  expect(screen.getByRole("alertdialog")).toBeTruthy();
  rerender(<FormDialog {...props} open={false} />);
  rerender(<FormDialog {...props} open />);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

it("allows a feature to keep its own drawer footer without adding actions", () => {
  render(
    <DetailDrawer title="Voorbeeld" triggerLabel="Open" closeLabel="Sluiten" open footer={null}>
      <p>Details</p>
    </DetailDrawer>,
  );
  expect(screen.getAllByRole("button", { name: "Sluiten" })).toHaveLength(1);
});
