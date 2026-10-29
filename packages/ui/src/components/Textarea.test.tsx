import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Textarea } from "./Textarea.tsx";
import { axeViolations } from "../test-utils.ts";
describe("Textarea", () => {
  it("updates its announced character count and wires errors", async () => {
    render(<Textarea label="Omschrijving" hint="Vacaturetekst" maxLength={20} error="Controleer tekst" />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "Hoi");
    expect(screen.getByText("3 / 20")).toBeTruthy();
    expect(input.getAttribute("aria-describedby")).toContain("error");
  });
  it("passes axe", async () => {
    const { container } = render(<Textarea label="Omschrijving" required maxLength={20} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
