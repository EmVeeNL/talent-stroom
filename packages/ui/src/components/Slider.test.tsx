import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Slider } from "./Slider.tsx";
import { axeViolations } from "../test-utils.ts";
describe("Slider", () => {
  it("announces formatted value and limit labels", () => {
    render(<Slider label="Salaris" min={1} max={3} value={2} onChange={() => {}} formatValue={(v) => `€ ${v}`} />);
    expect(screen.getByRole("slider").getAttribute("aria-valuetext")).toBe("€ 2");
  });
  it("passes axe", async () => {
    const { container } = render(<Slider label="Prioriteit" min={1} max={3} value={2} onChange={() => {}} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
