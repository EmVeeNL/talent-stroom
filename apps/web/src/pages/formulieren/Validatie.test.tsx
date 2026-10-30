import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ValidatiePage from "./Validatie.tsx";

describe("ValidatiePage", () => {
  it("summarizes invalid fields and associates inline errors accessibly", () => {
    render(<ValidatiePage locale="nl-NL" />);
    fireEvent.click(screen.getByRole("button", { name: "Opslaan" }));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(screen.getByRole("textbox", { name: /Naam/ }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("textbox", { name: /E-mailadres/ }).getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Naam/ }).getAttribute("href")).toBe("#validation-name");
  });
});
