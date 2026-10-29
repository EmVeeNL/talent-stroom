import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { NumberInput } from "./NumberInput.tsx";
import { axeViolations } from "../test-utils.ts";
describe("NumberInput", () => {
  it("increments and decrements by step with buttons and arrow keys", async () => {
    render(
      <NumberInput
        label="Salaris"
        defaultValue={4000}
        step={500}
        min={3000}
        max={5000}
        decrementLabel="Omlaag"
        incrementLabel="Omhoog"
      />,
    );
    const input = screen.getByRole("spinbutton");
    await userEvent.type(input, "{arrowup}");
    expect(input).toHaveProperty("value", "4500");
    await userEvent.click(screen.getByRole("button", { name: "Omhoog" }));
    expect(input).toHaveProperty("value", "5000");
  });
  it("passes axe", async () => {
    const { container } = render(
      <NumberInput label="Salaris" defaultValue={4000} decrementLabel="Omlaag" incrementLabel="Omhoog" />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
