import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Logo, MARK_PATHS } from "./Logo.tsx";

describe("Logo", () => {
  it("exposes the brand name as accessible name", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: "TalentStroom" })).toBeTruthy();
  });

  it("renders the wordmark as real text in the full variant only", () => {
    const { container, rerender } = render(<Logo variant="full" />);
    expect(container.textContent).toBe("TalentStroom");
    rerender(<Logo variant="mark" />);
    expect(container.textContent).toBe("");
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("supports a custom label, tone and size", () => {
    render(<Logo label="TalentStroom thuis" tone="dark" size="lg" />);
    const logo = screen.getByRole("img", { name: "TalentStroom thuis" });
    expect(logo.getAttribute("data-tone")).toBe("dark");
    expect(logo.className).toContain("ts-logo--lg");
  });

  it("is hidden from assistive technology when decorative", () => {
    const { container } = render(<Logo decorative />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });

  it("keeps the component paths identical to the SVG source", () => {
    const svg = readFileSync("src/brand/talentstroom-mark.svg", "utf8");
    expect(svg).toContain(MARK_PATHS.small);
    expect(svg).toContain(MARK_PATHS.big);
    expect(svg).not.toContain("<image");
  });

  it("has no axe violations in any variant or tone", async () => {
    const { container } = render(
      <div>
        <Logo />
        <Logo variant="mark" tone="dark" />
        <Logo tone="light" decorative />
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
