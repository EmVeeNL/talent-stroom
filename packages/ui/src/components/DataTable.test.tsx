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
  it("keeps controlled sorting until the caller supplies the next sort", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(sort: DataTableSort) => void>();
    const props = {
      caption: "Kandidaten",
      columns: [
        {
          id: "name",
          label: "Naam",
          cell: (r: { name: string }) => r.name,
          sortValue: (r: { name: string }) => r.name,
        },
      ],
      rows: [{ name: "Zara" }, { name: "Sam" }],
      rowKey: (r: { name: string }) => r.name,
      emptyLabel: "Leeg",
      loadingLabel: "Laden",
      sort: { id: "name", direction: "ascending" as const },
      onSortChange: change,
    };
    const { rerender } = render(<DataTable {...props} />);
    await user.click(screen.getByRole("button", { name: /Naam/ }));
    expect(change).toHaveBeenCalledWith({ id: "name", direction: "descending" });
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Sam");
    rerender(<DataTable {...props} sort={{ id: "name", direction: "descending" }} />);
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Zara");
  });
  it("allows callers to control selected rows", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(ids: string[]) => void>();
    render(
      <DataTable
        caption="Kandidaten"
        columns={[{ id: "name", label: "Naam", cell: (r: { id: string }) => r.id }]}
        rows={[{ id: "a" }, { id: "b" }]}
        rowKey={(r) => r.id}
        selectedIds={["a"]}
        onSelectionChange={change}
        selectAllLabel="Alles"
        selectRowLabel={(n) => `Selecteer ${n}`}
        emptyLabel="Leeg"
        loadingLabel="Laden"
      />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Selecteer b" }));
    expect(change).toHaveBeenCalledWith(["a", "b"]);
    expect(screen.getByRole<HTMLInputElement>("checkbox", { name: "Selecteer b" }).checked).toBe(false);
  });
  it("supports controlled column visibility without changing the column definitions", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(visibility: Record<string, boolean>) => void>();
    const props = {
      caption: "Kandidaten",
      columns: [
        { id: "name", label: "Naam", cell: (r: { name: string; city: string }) => r.name },
        { id: "city", label: "Plaats", cell: (r: { name: string; city: string }) => r.city },
      ],
      rows: [{ name: "Sam", city: "Utrecht" }],
      rowKey: (r: { name: string }) => r.name,
      emptyLabel: "Leeg",
      loadingLabel: "Laden",
      columnVisibility: { city: false },
      onColumnVisibilityChange: change,
      columnVisibilityLabel: "Kolommen",
      columnVisibilityOptions: [{ id: "city", label: "Plaats" }],
    };
    const { rerender } = render(<DataTable {...props} />);
    expect(screen.queryByRole("columnheader", { name: "Plaats" })).toBeNull();
    await user.click(screen.getByRole("checkbox", { name: "Plaats" }));
    expect(change).toHaveBeenCalledWith({ city: true });
    rerender(<DataTable {...props} columnVisibility={{ city: true }} />);
    expect(screen.getByRole("columnheader", { name: "Plaats" })).toBeTruthy();
  });
  it("paginates only when pagination is explicitly enabled", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        caption="Kandidaten"
        columns={[{ id: "name", label: "Naam", cell: (r: { name: string }) => r.name }]}
        rows={[{ name: "Sam" }, { name: "Zara" }, { name: "Noor" }]}
        rowKey={(r) => r.name}
        emptyLabel="Leeg"
        loadingLabel="Laden"
        pagination={{
          pageSize: 2,
          label: "Paginering",
          previousLabel: "Vorige",
          nextLabel: "Volgende",
          pageLabel: (page) => "Pagina " + page,
          pageSizeLabel: "Per pagina",
        }}
      />,
    );
    expect(screen.getAllByRole("row")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Volgende" }));
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getAllByRole("row")[1]?.textContent).toContain("Noor");
  });
});
