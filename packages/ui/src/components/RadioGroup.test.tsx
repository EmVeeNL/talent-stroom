import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { RadioGroup } from "./RadioGroup.tsx";
import { axeViolations } from "../test-utils.ts";
describe("RadioGroup", () => {
  it("supports native radio selection", async () => {
    render(
      <RadioGroup
        label="Contract"
        options={[
          { value: "vast", label: "Vast" },
          { value: "tijdelijk", label: "Tijdelijk" },
        ]}
      />,
    );
    await userEvent.click(screen.getByLabelText("Vast"));
    expect(screen.getByLabelText("Vast")).toHaveProperty("checked", true);
  });
  it("passes axe", async () => {
    const { container } = render(<RadioGroup label="Contract" options={[{ value: "vast", label: "Vast" }]} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
