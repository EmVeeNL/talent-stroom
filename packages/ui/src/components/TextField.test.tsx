import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { TextField } from "./TextField.tsx";

describe("TextField", () => {
  it("associates the label with the input", async () => {
    render(<TextField label="E-mailadres" />);
    await userEvent.type(screen.getByLabelText("E-mailadres"), "a@example.test");
    expect(screen.getByRole("textbox")).toHaveProperty("value", "a@example.test");
  });

  it("wires the hint via aria-describedby", () => {
    render(<TextField label="Naam" hint="Voor- en achternaam" />);
    const input = screen.getByRole("textbox");
    const hint = screen.getByText("Voor- en achternaam");
    expect(input.getAttribute("aria-describedby")).toBe(hint.id);
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("wires the error via aria-invalid and aria-describedby (after the hint)", () => {
    render(<TextField label="Naam" hint="Voor- en achternaam" error="Naam is verplicht" />);
    const input = screen.getByRole("textbox");
    const error = screen.getByRole("alert");
    expect(error.textContent).toBe("Naam is verplicht");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const ids = (input.getAttribute("aria-describedby") ?? "").split(" ");
    expect(ids).toContain(error.id);
    expect(ids).toContain(screen.getByText("Voor- en achternaam").id);
  });

  it("keeps a caller-provided aria-describedby", () => {
    render(<TextField label="Naam" aria-describedby="extern" />);
    expect(screen.getByRole("textbox").getAttribute("aria-describedby")).toBe("extern");
  });

  it("marks required natively and hides the visual asterisk from assistive tech", () => {
    render(<TextField label="Naam" required />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveProperty("required", true);
    expect(screen.getByLabelText("Naam *")).toBe(input);
    expect(document.querySelector(".ts-field__required")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("has no axe violations in default, hint, error, required and disabled states", async () => {
    const { container } = render(
      <div>
        <TextField label="A" />
        <TextField label="B" hint="Hint" />
        <TextField label="C" error="Fout" required />
        <TextField label="D" disabled />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
