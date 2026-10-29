import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { LineChart } from "./LineChart.tsx";
import { axeViolations } from "../test-utils.ts";

describe("LineChart", () => {
  it("offers accessible SVG, matching data table and focus tooltips", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <LineChart
        label="Plaatsingen"
        tableLabel="Gegevens"
        categories={["Jan", "Feb"]}
        series={[
          { id: "a", label: "Team A", values: [4, 8] },
          { id: "b", label: "Team B", values: [2, 6] },
        ]}
        area
      />,
    );
    expect(screen.getByRole("img", { name: "Plaatsingen" })).toBeDefined();
    await user.click(screen.getByText("Gegevens", { selector: "summary" }));
    expect(screen.getByRole("table").textContent).toContain("Team A");
    const mark = container.querySelector<SVGElement>("[data-chart-mark]");
    act(() => mark?.focus());
    expect(screen.getByRole("tooltip").textContent).toContain("4");
    expect(await axeViolations(container)).toEqual([]);
  });
  it("supports no series and zero values without invalid geometry", async () => {
    const { container, rerender } = render(
      <LineChart label="Lege grafiek" tableLabel="Gegevens" categories={[]} series={[]} />,
    );
    expect(await axeViolations(container)).toEqual([]);
    rerender(
      <LineChart
        label="Nul plaatsingen"
        tableLabel="Gegevens"
        categories={["Jan"]}
        series={[{ id: "a", label: "Team", values: [0] }]}
      />,
    );
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(await axeViolations(container)).toEqual([]);
  });
  it("dismisses focus and hover tooltips with Escape", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <LineChart
        label="Plaatsingen"
        tableLabel="Gegevens"
        categories={["Jan"]}
        series={[{ id: "a", label: "Team", values: [3] }]}
      />,
    );
    const point = container.querySelector<SVGElement>("[data-chart-mark]");
    act(() => point?.focus());
    expect(screen.getByRole("tooltip")).toBeDefined();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
