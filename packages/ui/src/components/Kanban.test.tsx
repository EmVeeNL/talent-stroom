import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { KanbanBoard, moveKanbanCard } from "./Kanban.tsx";
import type { KanbanColumnData, KanbanLabels, KanbanMove } from "./Kanban.tsx";

const labels: KanbanLabels = {
  board: "Pijplijn",
  instructions: "Spatie om op te pakken.",
  cardRole: "verplaatsbare kaart",
  count: (count) => `${count} kandidaten`,
  addCardShort: "Kandidaat toevoegen",
  addCard: (column) => `Toevoegen aan ${column}`,
  collapse: (column) => `${column} inklappen`,
  expand: (column) => `${column} uitklappen`,
  columnMenu: (column) => `Acties voor ${column}`,
  cardMenu: (name) => `Acties voor ${name}`,
  moveTo: (column) => `Verplaatsen naar ${column}`,
  emptyTitle: "Nog geen kandidaten",
  emptyBody: "Sleep een kandidaat hierheen.",
  pickedUp: ({ name, column, position, total }) => `${name} opgepakt in ${column}, positie ${position} van ${total}`,
  moving: ({ name, column, position, total }) => `${name} in ${column}, positie ${position} van ${total}`,
  moved: ({ name, column, position, total }) => `${name} verplaatst naar ${column}, positie ${position} van ${total}`,
  cancelled: (name) => `Verplaatsen van ${name} geannuleerd`,
};

const columns: KanbanColumnData[] = [
  {
    id: "nieuw",
    title: "Nieuw",
    tone: "info",
    cards: [
      { id: "c1", name: "Sanne Willems", role: "Java developer", meta: "2 d in fase" },
      { id: "c2", name: "Joris van den Berg", role: "Tester", status: { label: "Urgent", tone: "danger" } },
    ],
  },
  { id: "gesprek", title: "Gesprek", tone: "violet", cards: [{ id: "c3", name: "Lotte Hendriks" }] },
  { id: "geplaatst", title: "Geplaatst", tone: "success", cards: [] },
];

const setup = (props: Partial<Parameters<typeof KanbanBoard>[0]> = {}) => {
  const onMove = vi.fn<(move: KanbanMove) => void>();
  const view = render(<KanbanBoard columns={columns} labels={labels} onMove={onMove} view="board" {...props} />);
  return { onMove, ...view };
};
const card = (name: string) => screen.getByRole("article", { name });
const status = () => screen.getByRole("status").textContent;

describe("KanbanBoard rendering", () => {
  it("renders stage columns with title, count and cards", () => {
    setup();
    const column = screen.getByRole("region", { name: "Nieuw" });
    expect(within(column).getByText("2 kandidaten")).toBeTruthy();
    expect(within(column).getByRole("heading", { name: "Sanne Willems" })).toBeTruthy();
    expect(within(column).getByText("Java developer")).toBeTruthy();
    expect(within(column).getByText("2 d in fase")).toBeTruthy();
    expect(within(column).getByText(/Urgent/)).toBeTruthy();
    expect(column.getAttribute("data-tone")).toBe("info");
  });

  it("shows a compact empty state in an empty column", () => {
    setup();
    const column = screen.getByRole("region", { name: "Geplaatst" });
    expect(within(column).getByText("Nog geen kandidaten")).toBeTruthy();
    expect(column.querySelector(".ts-empty-state--compact")).toBeTruthy();
  });

  it("collapses and expands a column, keeping the toggle accessible", () => {
    setup();
    const toggle = screen.getByRole("button", { name: "Nieuw inklappen" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(screen.queryByText("Sanne Willems")).toBeNull();
    const expand = screen.getByRole("button", { name: "Nieuw uitklappen" });
    expect(expand.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("region", { name: "Nieuw" }).hasAttribute("data-collapsed")).toBe(true);
    fireEvent.click(expand);
    expect(screen.getByText("Sanne Willems")).toBeTruthy();
  });

  it("supports controlled collapse state", () => {
    const onCollapsedChange = vi.fn<(ids: string[]) => void>();
    setup({ collapsedColumnIds: ["gesprek"], onCollapsedChange });
    expect(screen.queryByText("Lotte Hendriks")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Gesprek uitklappen" }));
    expect(onCollapsedChange).toHaveBeenCalledWith([]);
  });

  it("calls onAddCard and offers a column menu when supplied", () => {
    const onAddCard = vi.fn<(columnId: string) => void>();
    const onSelect = vi.fn<() => void>();
    setup({ onAddCard, columnMenuItems: () => [{ id: "sort", label: "Sorteren", onSelect }] });
    const add = screen.getAllByRole("button", { name: "Toevoegen aan Nieuw" });
    expect(add[0]?.textContent).toContain("Kandidaat toevoegen");
    fireEvent.click(add[0] ?? document.body);
    expect(onAddCard).toHaveBeenCalledWith("nieuw");
    fireEvent.click(screen.getByRole("button", { name: "Acties voor Nieuw" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Sorteren" }));
    expect(onSelect).toHaveBeenCalled();
  });

  it("renders the grouped list view instead of a scrolling board on mobile", () => {
    const { container } = setup({ view: "list" });
    expect(container.querySelector(".ts-kanban--list")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Pijplijn" })).toBeNull();
    expect(card("Sanne Willems").getAttribute("draggable")).not.toBe("true");
    expect(screen.getByRole("region", { name: "Gesprek" })).toBeTruthy();
  });

  it("renders age, screen reader age text and tags", () => {
    setup({
      columns: [
        {
          id: "a",
          title: "A",
          cards: [{ id: "x", name: "Test Persoon", age: "2d", ageLabel: "2 dagen in fase", tags: ["Java", "Spring"] }],
        },
      ],
    });
    expect(screen.getByText("2d").getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("2 dagen in fase")).toBeTruthy();
    expect(screen.getByText("Spring")).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = setup({
      onAddCard: () => undefined,
      columnMenuItems: () => [{ id: "a", label: "Actie", onSelect: () => undefined }],
    });
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("KanbanBoard moving without dragging", () => {
  it("moves a card through the Verplaatsen naar menu and announces it", () => {
    const { onMove } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Acties voor Sanne Willems" }));
    expect(screen.queryByRole("menuitem", { name: "Verplaatsen naar Nieuw" })).toBeNull();
    fireEvent.click(screen.getByRole("menuitem", { name: "Verplaatsen naar Gesprek" }));
    expect(onMove).toHaveBeenCalledWith({
      cardId: "c1",
      fromColumnId: "nieuw",
      toColumnId: "gesprek",
      toIndex: 1,
    });
    expect(status()).toBe("Sanne Willems verplaatst naar Gesprek, positie 2 van 2");
  });

  it("keeps caller menu items after the move items", () => {
    const onSelect = vi.fn<() => void>();
    setup({ cardMenuItems: () => [{ id: "open", label: "Profiel openen", onSelect }] });
    fireEvent.click(screen.getByRole("button", { name: "Acties voor Sanne Willems" }));
    const items = screen.getAllByRole("menuitem").map((item) => item.dataset["label"]);
    expect(items).toEqual(["Verplaatsen naar Gesprek", "Verplaatsen naar Geplaatst", "Profiel openen"]);
  });

  it("picks up with Space, moves with arrows, drops with Space", () => {
    const { onMove } = setup();
    const target = card("Sanne Willems");
    target.focus();
    fireEvent.keyDown(target, { key: " " });
    expect(status()).toBe("Sanne Willems opgepakt in Nieuw, positie 1 van 2");
    fireEvent.keyDown(card("Sanne Willems"), { key: "ArrowRight" });
    expect(status()).toBe("Sanne Willems in Gesprek, positie 1 van 2");
    expect(onMove).not.toHaveBeenCalled();
    // The board never mutates data: the lifted card is previewed in the target column.
    expect(within(screen.getByRole("region", { name: "Gesprek" })).getByText("Sanne Willems")).toBeTruthy();
    expect(document.activeElement).toBe(card("Sanne Willems"));
    fireEvent.keyDown(card("Sanne Willems"), { key: "ArrowDown" });
    expect(status()).toBe("Sanne Willems in Gesprek, positie 2 van 2");
    fireEvent.keyDown(card("Sanne Willems"), { key: " " });
    expect(onMove).toHaveBeenCalledExactlyOnceWith({
      cardId: "c1",
      fromColumnId: "nieuw",
      toColumnId: "gesprek",
      toIndex: 1,
    });
    expect(status()).toBe("Sanne Willems verplaatst naar Gesprek, positie 2 van 2");
    // Back to the controlled data until the caller applies the move.
    expect(within(screen.getByRole("region", { name: "Nieuw" })).getByText("Sanne Willems")).toBeTruthy();
  });

  it("reorders within a column with ArrowUp and ArrowDown", () => {
    const { onMove } = setup();
    fireEvent.keyDown(card("Joris van den Berg"), { key: " " });
    fireEvent.keyDown(card("Joris van den Berg"), { key: "ArrowUp" });
    expect(status()).toBe("Joris van den Berg in Nieuw, positie 1 van 2");
    fireEvent.keyDown(card("Joris van den Berg"), { key: " " });
    expect(onMove).toHaveBeenCalledWith({
      cardId: "c2",
      fromColumnId: "nieuw",
      toColumnId: "nieuw",
      toIndex: 0,
    });
  });

  it("cancels with Escape without calling onMove", () => {
    const { onMove } = setup();
    fireEvent.keyDown(card("Sanne Willems"), { key: " " });
    fireEvent.keyDown(card("Sanne Willems"), { key: "ArrowRight" });
    fireEvent.keyDown(card("Sanne Willems"), { key: "Escape" });
    expect(onMove).not.toHaveBeenCalled();
    expect(status()).toBe("Verplaatsen van Sanne Willems geannuleerd");
    expect(within(screen.getByRole("region", { name: "Nieuw" })).getByText("Sanne Willems")).toBeTruthy();
  });

  it("does not move when the card is dropped where it started", () => {
    const { onMove } = setup();
    fireEvent.keyDown(card("Sanne Willems"), { key: " " });
    fireEvent.keyDown(card("Sanne Willems"), { key: " " });
    expect(onMove).not.toHaveBeenCalled();
  });

  it("ignores Space from controls inside the card", () => {
    setup();
    fireEvent.keyDown(screen.getByRole("button", { name: "Acties voor Sanne Willems" }), { key: " " });
    expect(status()).toBe("");
  });
});

const dataTransfer = () => ({
  setData: vi.fn<(format: string, data: string) => void>(),
  effectAllowed: "",
  dropEffect: "",
});

describe("KanbanBoard pointer drag and drop", () => {
  it("calls onMove when a card is dropped on another column", () => {
    const { onMove } = setup();
    const source = card("Sanne Willems");
    expect(source.getAttribute("draggable")).toBe("true");
    fireEvent.dragStart(source, { dataTransfer: dataTransfer() });
    const target = screen.getByRole("region", { name: "Geplaatst" });
    fireEvent.dragOver(target, { dataTransfer: dataTransfer() });
    fireEvent.drop(target, { dataTransfer: dataTransfer() });
    expect(onMove).toHaveBeenCalledWith({
      cardId: "c1",
      fromColumnId: "nieuw",
      toColumnId: "geplaatst",
      toIndex: 0,
    });
    expect(status()).toBe("Sanne Willems verplaatst naar Geplaatst, positie 1 van 1");
  });

  it("does nothing when dropped without a drag in progress", () => {
    const { onMove } = setup();
    fireEvent.drop(screen.getByRole("region", { name: "Gesprek" }));
    expect(onMove).not.toHaveBeenCalled();
  });

  it("clears the drag state on dragend", () => {
    const { container } = setup();
    fireEvent.dragStart(card("Sanne Willems"), { dataTransfer: dataTransfer() });
    expect(card("Sanne Willems").hasAttribute("data-dragging")).toBe(true);
    fireEvent.dragEnd(card("Sanne Willems"));
    expect(card("Sanne Willems").hasAttribute("data-dragging")).toBe(false);
    expect(container.querySelector(".ts-kanban__drop-indicator")).toBeNull();
  });
});

describe("moveKanbanCard", () => {
  it("moves a card across columns without mutating the input", () => {
    const next = moveKanbanCard(columns, { cardId: "c1", fromColumnId: "nieuw", toColumnId: "gesprek", toIndex: 0 });
    expect(next.map((column) => column.cards.map((c) => c.id))).toEqual([["c2"], ["c1", "c3"], []]);
    expect(columns[0]?.cards.map((c) => c.id)).toEqual(["c1", "c2"]);
  });

  it("reorders within a column and clamps the index", () => {
    const next = moveKanbanCard(columns, { cardId: "c1", fromColumnId: "nieuw", toColumnId: "nieuw", toIndex: 9 });
    expect(next[0]?.cards.map((c) => c.id)).toEqual(["c2", "c1"]);
  });

  it("ignores unknown cards and columns", () => {
    expect(moveKanbanCard(columns, { cardId: "x", fromColumnId: "nieuw", toColumnId: "gesprek", toIndex: 0 })).toEqual(
      columns,
    );
    expect(moveKanbanCard(columns, { cardId: "c1", fromColumnId: "nieuw", toColumnId: "nope", toIndex: 0 })).toEqual(
      columns,
    );
  });
});
