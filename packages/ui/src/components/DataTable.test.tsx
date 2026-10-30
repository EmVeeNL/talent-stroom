import type { DataTableSort } from "./DataTable.tsx";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DataTable } from "./DataTable.tsx";
import { axeViolations } from "../test-utils.ts";

function DataTableExample() {
  const [selected, setSelected] = useState(["other"]);
  return (
    <DataTable
      caption="Kandidaten"
      columns={[{ id: "name", label: "Naam", cell: (r: { id: string }) => r.id }]}
      rows={[{ id: "visible" }]}
      rowKey={(r) => r.id}
      selectedIds={selected}
      onSelectionChange={setSelected}
      selectAllLabel="Alles"
      selectRowLabel={(n) => `Selecteer ${n}`}
      emptyLabel="Leeg"
      loadingLabel="Laden"
    />
  );
}

describe("DataTable", () => {
  it("sorts semantically and selects rows with a mixed header checkbox", async () => {
    const user = userEvent.setup();
    const select = vi.fn<(value: string[]) => void>();
    const { container } = render(
      <DataTable
        caption="Kandidaten"
        columns={[{ id: "name", label: "Naam", cell: (r) => r.name, sortValue: (r) => r.name }]}
        rows={[
          { id: "a", name: "Zara Voorbeeld" },
          { id: "b", name: "Sam Voorbeeld" },
        ]}
        rowKey={(r) => r.id}
        rowLabel={(r) => r.name}
        selectedIds={["a"]}
        onSelectionChange={select}
        selectAllLabel="Alles selecteren"
        selectRowLabel={(n) => `Selecteer ${n}`}
        emptyLabel="Geen kandidaten"
        loadingLabel="Laden"
      />,
    );
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Alles selecteren" }).indeterminate).toBe(true);
    await user.click(screen.getByRole("button", { name: /Naam/ }));
    expect(container.querySelector('th[aria-sort="ascending"]')).not.toBeNull();
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Sam");
    await user.click(screen.getByRole("checkbox", { name: "Alles selecteren" }));
    expect(select).toHaveBeenCalledWith(["a", "b"]);
    expect(await axeViolations(container)).toEqual([]);
  });
  it("supports empty and loading states", async () => {
    const props = {
      caption: "Kandidaten",
      columns: [{ id: "id", label: "Naam", cell: (r: { id: string }) => r.id }],
      rows: [],
      rowKey: (r: { id: string }) => r.id,
      emptyLabel: "Geen kandidaten",
      loadingLabel: "Laden",
    };
    const { container, rerender } = render(<DataTable {...props} />);
    expect(screen.getByText("Geen kandidaten").closest(".ts-data-table")).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
    rerender(<DataTable {...props} loading />);
    expect(screen.getByRole("region").getAttribute("aria-busy")).toBe("true");
    expect(await axeViolations(container)).toEqual([]);
  });
  it("keeps selection on other pages when selecting and clearing the visible page", async () => {
    const user = userEvent.setup();

    const { container } = render(<DataTableExample />);
    const all = screen.getByRole<HTMLInputElement>("checkbox", { name: "Alles" });
    await user.click(all);
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Selecteer visible" }).checked).toBe(true);
    await user.click(all);
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Selecteer visible" }).checked).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });
  it("exposes controlled sorting changes through keyboard activation", async () => {
    const user = userEvent.setup(),
      change = vi.fn<(sort: DataTableSort) => void>();
    const { container } = render(
      <DataTable
        caption="Kandidaten"
        columns={[{ id: "name", label: "Naam", cell: (r: { name: string }) => r.name, sortValue: (r) => r.name }]}
        rows={[{ name: "Sam Voorbeeld" }]}
        rowKey={(r) => r.name}
        emptyLabel="Leeg"
        loadingLabel="Laden"
        sort={{ id: "name", direction: "ascending" }}
        onSortChange={change}
      />,
    );
    screen.getByRole("button", { name: "Naam" }).focus();
    await user.keyboard("{Enter}");
    expect(change).toHaveBeenCalledWith({ id: "name", direction: "descending" });
    expect(await axeViolations(container)).toEqual([]);
  });
});
