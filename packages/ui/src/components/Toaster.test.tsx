import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Toaster, useToast } from "./Toaster.tsx";
function Demo() {
  const { toast } = useToast();
  return <button onClick={() => toast({ message: "Opgeslagen", duration: 0 })}>Toevoegen</button>;
}
it("queues beyond its visible limit and promotes a queued notification after dismiss", async () => {
  const { container } = render(
    <Toaster label="Meldingen" closeLabel="Sluiten" maxVisible={2}>
      <Demo />
    </Toaster>,
  );
  await userEvent.click(screen.getByText("Toevoegen"));
  await userEvent.click(screen.getByText("Toevoegen"));
  await userEvent.click(screen.getByText("Toevoegen"));
  expect(screen.getAllByRole("status")).toHaveLength(2);
  expect(await axeViolations(container)).toEqual([]);
  const close = screen.getAllByRole("button", { name: "Sluiten" }).at(0);
  if (!close) throw new Error("Missing close button");
  await userEvent.click(close);
  expect(screen.getAllByRole("status")).toHaveLength(2);
});

function Many() {
  const { toast } = useToast();
  return (
    <>
      <button onClick={() => toast({ message: "Blijvend", persistent: true, duration: 50 })}>Blijvend</button>
      <button onClick={() => toast({ message: "Tijdelijk", duration: 200 })}>Tijdelijk</button>
    </>
  );
}

it("keeps persistent notifications open, expands the stack on hover and pauses all timers", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  const { container } = render(
    <Toaster label="Meldingen" closeLabel="Sluiten">
      <Many />
    </Toaster>,
  );
  fireEvent.click(screen.getByText("Blijvend"));
  fireEvent.click(screen.getByText("Tijdelijk"));
  const toaster = container.querySelector(".ts-toaster");
  if (!toaster) throw new Error("Missing toaster");
  expect(toaster.getAttribute("data-expanded")).toBe("false");
  fireEvent.mouseEnter(toaster);
  expect(toaster.getAttribute("data-expanded")).toBe("true");
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.getAllByRole("status")).toHaveLength(2);
  fireEvent.mouseLeave(toaster);
  act(() => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.getAllByRole("status")).toHaveLength(1);
  expect(screen.getByRole("status").textContent).toContain("Blijvend");
  vi.useRealTimers();
});
