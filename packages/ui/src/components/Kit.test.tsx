import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { DataTable } from "./DataTable.tsx";
import { Skeleton } from "./Skeleton.tsx";
import { Toast } from "./Toast.tsx";
import { DatePicker } from "./DatePicker.tsx";
import { axeViolations } from "../test-utils.ts";

it("exposes table density and an accessible scroll instruction", () => {
  render(
    <DataTable
      caption="Kandidaten"
      columns={[{ id: "name", label: "Naam", cell: (row: string) => row }]}
      rows={["Sam Voorbeeld"]}
      rowKey={(row) => row}
      density="compact"
      scrollLabel="Scroll horizontaal voor alle kolommen"
      emptyLabel="Leeg"
      loadingLabel="Laden"
    />,
  );
  expect(screen.getByRole("region").getAttribute("data-density")).toBe("compact");
  expect(screen.getByRole("region").getAttribute("aria-describedby")).toBe(
    screen.getByText("Scroll horizontaal voor alle kolommen").id,
  );
});
it.each(["table", "card", "profile"] as const)("renders the decorative %s preset", (variant) => {
  const { container } = render(<Skeleton variant={variant} lines={3} />);
  expect(container.querySelector(`.ts-skeleton--${variant}[aria-hidden="true"]`)).toBeTruthy();
});
it("renders a toast title, body, action and icon close without changing its lifetime", async () => {
  const dismiss = vi.fn<() => void>(),
    action = vi.fn<() => void>();
  const { container } = render(
    <Toast
      tone="error"
      title="Upload mislukt"
      action={<button onClick={action}>Opnieuw proberen</button>}
      duration={0}
      closeLabel="Sluiten"
      onDismiss={dismiss}
    >
      Controleer het bestand.
    </Toast>,
  );
  expect(screen.getByRole("alert").textContent).toContain("Upload mislukt");
  await userEvent.click(screen.getByRole("button", { name: "Opnieuw proberen" }));
  expect(action).toHaveBeenCalledOnce();
  await userEvent.click(screen.getByRole("button", { name: "Sluiten" }));
  expect(dismiss).toHaveBeenCalledOnce();
  expect(await axeViolations(container)).toEqual([]);
});
it("selects a single Dutch date using the Monday-first keyboard grid and returns focus", async () => {
  const user = userEvent.setup(),
    change = vi.fn<(date: Date) => void>();
  const { container } = render(
    <DatePicker
      label="Datum"
      today={new Date(2026, 0, 31)}
      onChange={change}
      labels={{ previous: "Vorige maand", next: "Volgende maand", today: "Vandaag", hint: "Kies een datum" }}
    />,
  );
  const trigger = screen.getByRole("button", { name: /Datum/ });
  await user.click(trigger);
  expect(screen.getAllByRole("columnheader")[0]?.getAttribute("abbr")).toBe("maandag");
  await user.keyboard("{PageDown}");
  expect(document.activeElement?.getAttribute("aria-label")).toBe("zaterdag 28 februari 2026");
  await user.keyboard("{Home}{Enter}");
  expect(change).toHaveBeenLastCalledWith(new Date(2026, 1, 23));
  expect(screen.queryByRole("grid")).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(await axeViolations(container)).toEqual([]);
});

it("places the date label above a field containing only the placeholder or formatted date", () => {
  const props = {
    label: "Datum kiezen",
    onChange: vi.fn<(date: Date) => void>(),
    labels: { previous: "Vorige", next: "Volgende", today: "Vandaag", hint: "Kies een datum" },
  };
  const { rerender } = render(<DatePicker {...props} />);
  expect(screen.getByRole("button", { name: /Datum kiezen/ }).querySelector(".ts-button__label")?.textContent).toBe(
    "Kies een datum",
  );
  rerender(<DatePicker {...props} value={new Date(2026, 9, 30)} />);
  expect(screen.getByRole("button", { name: /Datum kiezen/ }).querySelector(".ts-button__label")?.textContent).toBe(
    "30 oktober 2026",
  );
});
