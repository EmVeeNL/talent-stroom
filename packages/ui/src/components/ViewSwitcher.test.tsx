import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ViewSwitcher } from "./ViewSwitcher.tsx";
import { axeViolations } from "../test-utils.ts";

function ViewSwitcherExample() {
  const [value, setValue] = useState("table");
  return (
    <ViewSwitcher
      label="Weergave"
      value={value}
      onChange={setValue}
      options={[
        { value: "table", label: "Tabel" },
        { value: "cards", label: "Kaarten", disabled: true },
        { value: "kanban", label: "Kanban" },
      ]}
    />
  );
}

describe("ViewSwitcher", () => {
  it("uses a radio group with roving arrow-key focus", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string) => void>();
    const { container } = render(
      <ViewSwitcher
        label="Weergave"
        options={[
          { value: "table", label: "Tabel" },
          { value: "cards", label: "Kaarten" },
          { value: "kanban", label: "Kanban" },
        ]}
        value="table"
        onChange={change}
      />,
    );
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(change).toHaveBeenCalledWith("cards");
    expect(document.activeElement?.textContent).toContain("Kaarten");
    expect(await axeViolations(container)).toEqual([]);
  });
  it("wraps, skips disabled choices and supports Home and End", async () => {
    const user = userEvent.setup();

    const { container } = render(<ViewSwitcherExample />);
    await user.tab();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Kanban" }).getAttribute("aria-checked")).toBe("true");
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Tabel" }));
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Kanban" }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
