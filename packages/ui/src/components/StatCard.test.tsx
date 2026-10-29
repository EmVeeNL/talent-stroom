import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatCard } from "./StatCard.tsx";
import { axeViolations } from "../test-utils.ts";

describe("StatCard", () => {
  it("formats Dutch numbers and reads as one text", async () => {
    const { container } = render(
      <StatCard
        label="Plaatsingen"
        value={1234.5}
        description="Dit jaar"
        trend={{ value: 12.5, comparisonLabel: "vorige maand" }}
      />,
    );
    expect(container.querySelector(".ts-visually-hidden")?.textContent).toContain("1.234,5");
    expect(await axeViolations(container)).toEqual([]);
  });
  it("supports currency, an optional icon and no trend", async () => {
    const { container } = render(
      <StatCard
        label="Omzet"
        value={128450}
        formatOptions={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
        icon="payments"
      />,
    );
    expect(container.querySelector(".ts-visually-hidden")?.textContent).toContain("128.450");
    expect(await axeViolations(container)).toEqual([]);
  });
});
