import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
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
    expect(await screen.findByRole("img", { name: "Plaatsingen" })).toBeDefined();
    await user.click(screen.getByText("Gegevens", { selector: "summary" }));
    expect(screen.getByRole("table").textContent).toContain("Team A");
    const mark = container.querySelector<SVGElement>("svg[tabindex]");
    act(() => mark?.focus());
    expect(screen.getByRole("tooltip").textContent).toContain("Jan");
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
  it("tracks document theme changes and keeps animation disabled for reduced motion", async () => {
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    };
    vi.stubGlobal(
      "matchMedia",
      vi.fn<() => typeof mediaQuery>(() => mediaQuery),
    );
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn<() => typeof mediaQuery>(() => mediaQuery),
    });
    document.documentElement.dataset["theme"] = "light";
    const { container } = render(
      <BarChart
        label="Plaatsingen"
        tableLabel="Gegevens"
        categories={["Jan"]}
        series={[{ id: "a", label: "Team", values: [1] }]}
      />,
    );
    const chart = await screen.findByRole("img", { name: "Plaatsingen" });
    expect(chart.closest("[data-chart-theme]")?.getAttribute("data-chart-theme")).toBe("light");
    document.documentElement.dataset["theme"] = "dark";
    await screen.findByRole("img", { name: "Plaatsingen" });
    expect(container.querySelector("[data-chart-theme='dark']")).not.toBeNull();
    expect(container.querySelector("[data-chart-animation='off']")).not.toBeNull();
    expect(container.querySelector("[data-chart-reduced-motion='yes']")).not.toBeNull();
    delete document.documentElement.dataset["theme"];
    vi.unstubAllGlobals();
  });
});
