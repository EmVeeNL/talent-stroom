import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { FacetedFilter } from "./FacetedFilter.tsx";
import { axeViolations } from "../test-utils.ts";

describe("FacetedFilter", () => {
  it("opens, searches, toggles and clears options", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string[]) => void>();
    const { container } = render(
      <FacetedFilter
        label="Status"
        searchLabel="Zoek status"
        clearLabel="Wissen"
        emptyLabel="Geen opties"
        options={[{ value: "new", label: "Nieuw", count: 3 }]}
        value={["new"]}
        onChange={change}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Status/ }));
    expect(screen.getByRole<HTMLInputElement>("checkbox").checked).toBe(true);
    await user.click(screen.getByRole("checkbox"));
    expect(change).toHaveBeenCalledWith([]);
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Wissen" }));
    expect(change).toHaveBeenLastCalledWith([]);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("announces no matching options and restores trigger focus after Escape", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FacetedFilter
        label="Bron"
        value={[]}
        onChange={() => {}}
        options={[{ value: "ref", label: "Referral", count: 4 }]}
        searchLabel="Zoek bron"
        clearLabel="Wissen"
        emptyLabel="Geen opties"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Bron" });
    await user.click(trigger);
    await user.type(screen.getByRole("searchbox"), "zz");
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Geen opties");
    expect(await axeViolations(container)).toEqual([]);
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(trigger);
  });
});
