import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { BarChart } from "./BarChart.tsx";
import { axeViolations } from "../test-utils.ts";

describe("BarChart", () => {
  it("offers accessible SVG, matching data table and focus tooltips", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BarChart
        label="Plaatsingen"
        tableLabel="Gegevens"
        categories={["Jan", "Feb"]}
        series={[
          { id: "a", label: "Team A", values: [4, 8] },
          { id: "b", label: "Team B", values: [2, 6] },
        ]}
        horizontal
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
      <BarChart label="Lege grafiek" tableLabel="Gegevens" categories={[]} series={[]} />,
    );
    expect(await axeViolations(container)).toEqual([]);
    rerender(
      <BarChart
        label="Nul plaatsingen"
        tableLabel="Gegevens"
        categories={["Jan"]}
        series={[{ id: "a", label: "Team", values: [0] }]}
      />,
    );
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(await axeViolations(container)).toEqual([]);
  });
});
