import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Icon } from "./Icon.tsx";

describe("Icon", () => {
  it("is decorative (aria-hidden) by default and renders the ligature", () => {
    const { container } = render(<Icon name="search" />);
    const icon = container.querySelector(".ts-icon");
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
    expect(icon?.textContent).toBe("search");
    expect(icon?.className).toContain("material-symbols-outlined");
  });

  it("is exposed as an image with a name when labelled", () => {
    render(<Icon name="warning" label="Waarschuwing" />);
    const icon = screen.getByRole("img", { name: "Waarschuwing" });
    expect(icon.getAttribute("aria-hidden")).toBeNull();
  });

  it("supports size and filled variants and passes axe", async () => {
    const { container } = render(
      <div>
        <Icon name="add" size={20} filled />
        <Icon name="info" label="Info" />
      </div>,
    );
    expect(container.querySelector(".ts-icon--20.ts-icon--filled")).toBeTruthy();
    expect(await axeViolations(container)).toEqual([]);
  });
});
