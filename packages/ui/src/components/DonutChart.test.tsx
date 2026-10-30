import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { DonutChart } from "./DonutChart.tsx";
import { axeViolations } from "../test-utils.ts";

describe("DonutChart", () => {
  it("names segments directly and includes matching data", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DonutChart
        label="Bronnen"
        tableLabel="Gegevens"
        data={[
          { id: "a", label: "Referral", value: 4 },
          { id: "b", label: "Website", value: 8 },
        ]}
      />,
    );
    expect(await screen.findByRole("img", { name: "Bronnen" })).toBeDefined();
    await user.click(screen.getByText("Gegevens", { selector: "summary" }));
    expect(screen.getByRole("table").textContent).toContain("Referral");
    act(() => container.querySelector<SVGElement>("svg[tabindex]")?.focus());
    expect(screen.getByRole("tooltip")).toBeDefined();
    expect(await axeViolations(container)).toEqual([]);
  });
  it("supports empty and all-zero data without invalid segments", async () => {
    const { container, rerender } = render(<DonutChart label="Bronnen" tableLabel="Gegevens" data={[]} />);
    expect(await axeViolations(container)).toEqual([]);
    rerender(<DonutChart label="Bronnen" tableLabel="Gegevens" data={[{ id: "a", label: "Website", value: 0 }]} />);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(await axeViolations(container)).toEqual([]);
  });
});
