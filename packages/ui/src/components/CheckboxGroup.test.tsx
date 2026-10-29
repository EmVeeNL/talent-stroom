import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Checkbox } from "./Checkbox.tsx";
import { CheckboxGroup } from "./CheckboxGroup.tsx";
import { axeViolations } from "../test-utils.ts";
describe("CheckboxGroup", () => {
  it("groups controls under a legend", () => {
    render(
      <CheckboxGroup legend="Arbeidsvoorwaarden">
        <Checkbox label="Pensioen" />
      </CheckboxGroup>,
    );
    expect(screen.getByRole("group", { name: "Arbeidsvoorwaarden" })).toBeTruthy();
  });
  it("passes axe", async () => {
    const { container } = render(
      <CheckboxGroup legend="Arbeidsvoorwaarden">
        <Checkbox label="Pensioen" />
      </CheckboxGroup>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
