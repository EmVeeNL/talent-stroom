import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ChartLegend } from "./ChartLegend.tsx";
import { axeViolations } from "../test-utils.ts";

describe("ChartLegend", () => {
  it("toggles series using pressed buttons", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string[]) => void>();
    const { container } = render(
      <ChartLegend label="Reeksen" items={[{ id: "a", label: "Plaatsingen" }]} visibleIds={["a"]} onChange={change} />,
    );
    const button = screen.getByRole("button", { name: /Plaatsingen/ });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    await user.click(button);
    expect(change).toHaveBeenCalledWith([]);
    expect(await axeViolations(container)).toEqual([]);
  });
  it("can restore a hidden series", async () => {
    const user = userEvent.setup(),
      change = vi.fn<(ids: string[]) => void>();
    const { container } = render(
      <ChartLegend
        label="Reeksen"
        items={[
          { id: "a", label: "Team A" },
          { id: "b", label: "Team B" },
        ]}
        visibleIds={[]}
        onChange={change}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Team B" }));
    expect(change).toHaveBeenCalledWith(["b"]);
    expect(await axeViolations(container)).toEqual([]);
  });
});
