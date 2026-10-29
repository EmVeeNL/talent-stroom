import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Avatar } from "./Avatar.tsx";
import { axeViolations } from "../test-utils.ts";

describe("Avatar", () => {
  it("falls back after image errors and keeps an accessible name", async () => {
    const { container } = render(<Avatar name="Sam Voorbeeld" src="/missing.png" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe("Sam Voorbeeld");
    expect(container.textContent).toContain("SV");
    expect(await axeViolations(container)).toEqual([]);
  });
  it.each(["sm", "md", "lg"] as const)("renders %s initials with the full accessible name", async (size) => {
    const { container } = render(<Avatar name="Sam Voorbeeld" size={size} />);
    expect(screen.getByRole("img", { name: "Sam Voorbeeld" })).toBeDefined();
    expect(await axeViolations(container)).toEqual([]);
  });
});
