import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Select } from "./Select.tsx";
import { axeViolations } from "../test-utils.ts";
describe("Select", () => {
  it("associates label, hint and placeholder", () => {
    render(
      <Select label="Klant" hint="Kies klant" placeholder="Selecteer">
        <option value="a">A</option>
      </Select>,
    );
    expect(screen.getByRole("combobox").getAttribute("aria-describedby")).toContain("hint");
  });
  it("passes axe", async () => {
    const { container } = render(
      <Select label="Klant" placeholder="Selecteer">
        <option value="a">A</option>
      </Select>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
