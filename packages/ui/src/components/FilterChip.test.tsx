import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { FilterChip } from "./FilterChip.tsx";

describe("FilterChip", () => {
  it("exposes toggle state and toggles with the keyboard", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn<(pressed: boolean) => void>();
    render(
      <FilterChip kind="toggle" pressed onPressedChange={onPressedChange}>
        Alle filters
      </FilterChip>,
    );
    const chip = screen.getByRole("button", { name: "Alle filters" });
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    chip.focus();
    await user.keyboard("{Enter}");
    expect(onPressedChange).toHaveBeenCalledWith(false);
  });

  it("removes a filter through a separately labelled close button", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn<() => void>();
    render(
      <FilterChip kind="removable" removeLabel="Filter Functie verwijderen" onRemove={onRemove}>
        Functie
      </FilterChip>,
    );
    await user.click(screen.getByRole("button", { name: "Filter Functie verwijderen" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("renders a dropdown affordance and an accessible add action", () => {
    render(
      <>
        <FilterChip kind="dropdown" onClick={() => {}}>
          Actieve filters (2)
        </FilterChip>
        <FilterChip kind="add" onClick={() => {}}>
          Filter toevoegen
        </FilterChip>
      </>,
    );
    expect(screen.getByRole("button", { name: "Actieve filters (2)" }).querySelector(".ts-icon")?.textContent).toBe(
      "expand_more",
    );
    expect(screen.getByRole("button", { name: "Filter toevoegen" })).toBeTruthy();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <>
        <FilterChip kind="toggle" pressed onPressedChange={() => {}}>
          Alle filters
        </FilterChip>
        <FilterChip kind="removable" removeLabel="Filter Functie verwijderen" onRemove={() => {}}>
          Functie
        </FilterChip>
        <FilterChip kind="dropdown" onClick={() => {}}>
          Actieve filters (2)
        </FilterChip>
        <FilterChip kind="add" onClick={() => {}}>
          Filter toevoegen
        </FilterChip>
      </>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
