import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TrendIndicator } from "./TrendIndicator.tsx";
import { axeViolations } from "../test-utils.ts";

describe("TrendIndicator", () => {
  it("exposes signed change and directional icon without colour", async () => {
    const { container } = render(<TrendIndicator value={12.5} comparisonLabel="t.o.v. vorige maand" />);
    expect(screen.getByText(/12,5%/).textContent).toContain("+");
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });
  it("supports flat and reversed desirability", async () => {
    const { container, rerender } = render(<TrendIndicator value={0} comparisonLabel="vorige maand" />);
    expect(container.textContent).toContain("0%");
    rerender(<TrendIndicator value={-4} upIsGood={false} comparisonLabel="vorige maand" />);
    expect(container.querySelector(".ts-trend--success")).not.toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });
});
