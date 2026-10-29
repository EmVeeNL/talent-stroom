import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Checkbox } from "./Checkbox.tsx";
import { axeViolations } from "../test-utils.ts";
describe("Checkbox", () => {
  it("supports indeterminate state and description", () => {
    render(<Checkbox label="Pensioen" description="Aanvullende regeling" indeterminate />);
    expect(document.querySelector<HTMLInputElement>("input")?.indeterminate).toBe(true);
    expect(screen.getByRole("checkbox").getAttribute("aria-describedby")).toContain("description");
  });
  it("passes axe", async () => {
    const { container } = render(<Checkbox label="Pensioen" description="Regeling" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
