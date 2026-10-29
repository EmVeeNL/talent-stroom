import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
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
  const close = screen.getAllByText("Sluiten").at(0);
  if (!close) throw new Error("Missing close button");
  await userEvent.click(close);
  expect(screen.getAllByRole("status")).toHaveLength(2);
});
