import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FormField } from "./FormField.tsx";
import { axeViolations } from "../test-utils.ts";
describe("FormField", () => {
  it("wires label, hint and error to custom controls", () => {
    render(
      <FormField label="Titel" hint="Functietitel" error="Verplicht">
        {({ id, describedBy, invalid }) => <input id={id} aria-describedby={describedBy} aria-invalid={invalid} />}
      </FormField>,
    );
    expect(screen.getByLabelText("Titel").getAttribute("aria-describedby")).toContain("error");
  });
  it("passes axe", async () => {
    const { container } = render(<FormField label="Titel">{({ id }) => <input id={id} />}</FormField>);
    expect(await axeViolations(container)).toEqual([]);
  });
});
