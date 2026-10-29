import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Progress } from "./Progress.tsx";
import { axeViolations } from "../test-utils.ts";

describe("Progress", () => {
  it("clamps values and labels determinate and indeterminate states", async () => {
    const { container, rerender } = render(<Progress label="Doel" value={120} />);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
    expect(await axeViolations(container)).toEqual([]);
    rerender(<Progress label="Laden" />);
    expect(screen.getByRole("progressbar").hasAttribute("aria-valuenow")).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });
  it.each(["neutral", "success", "warning", "danger", "info"] as const)(
    "labels %s progress with a custom range",
    async (tone) => {
      const { container } = render(
        <Progress label="Kwartaaldoel" min={20} max={40} value={30} tone={tone} formatValue={(n) => `${n} van 40`} />,
      );
      expect(screen.getByRole("progressbar").getAttribute("aria-valuemin")).toBe("20");
      expect(screen.getByText("30 van 40")).toBeDefined();
      expect(await axeViolations(container)).toEqual([]);
    },
  );
});
