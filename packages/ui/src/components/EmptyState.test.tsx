import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { EmptyState } from "./EmptyState.tsx";
import { axeViolations } from "../test-utils.ts";
it("distinguishes empty records, results and errors without announcing ordinary emptiness", async () => {
  const { container, rerender } = render(
    <EmptyState
      title="Geen kandidaten"
      body="Voeg een kandidaat toe."
      action={<button type="button">Toevoegen</button>}
    />,
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("button")).toBeTruthy();
  rerender(<EmptyState variant="no-results" title="Geen resultaten" body="Pas de filters aan." />);
  expect(screen.queryByRole("alert")).toBeNull();
  rerender(<EmptyState variant="error" title="Laden mislukt" body="Probeer opnieuw." />);
  expect(screen.getByRole("alert").textContent).toContain("Laden mislukt");
  expect(await axeViolations(container)).toEqual([]);
});
