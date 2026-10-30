import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Badge, StageBadge, StatusPill } from "./Badge.tsx";

describe("Badge and StatusPill", () => {
  it("applies the tone class", () => {
    render(<Badge tone="warning">Wacht</Badge>);
    expect(screen.getByText("Wacht").className).toContain("ts-badge--warning");
  });

  it("StatusPill conveys status with text and a hidden icon, not colour alone", () => {
    render(<StatusPill tone="success">Actief</StatusPill>);
    const pill = screen.getByText(/Actief/);
    expect(pill.querySelector(".ts-icon--16")).toBeTruthy();
    expect(pill.textContent).toContain("Actief");
    expect(pill.querySelector("[aria-hidden='true']")?.textContent).toBe("check_circle");
  });

  it("uses the shared recruitment stage definition for its tone and icon", () => {
    render(<StageBadge stage="gesprek">Gesprek</StageBadge>);
    const pill = screen.getByText("Gesprek");
    expect(pill.className).toContain("ts-badge--violet");
    expect(pill.querySelector(".ts-icon")?.textContent).toBe("handshake");
  });

  it("uses subtle stage styling by default and limits solid styling to accessible tones", () => {
    const { rerender } = render(<StatusPill tone="warning">Wacht</StatusPill>);
    expect(screen.getByText("Wacht").className).toContain("ts-badge--subtle");
    rerender(
      <StatusPill tone="warning" variant="solid">
        Wacht
      </StatusPill>,
    );
    expect(screen.getByText("Wacht").className).toContain("ts-badge--subtle");
  });

  it("has no axe violations for every tone", async () => {
    const tones = ["neutral", "success", "warning", "danger", "info"] as const;
    const { container } = render(
      <div>
        {tones.map((tone) => (
          <StatusPill key={tone} tone={tone}>
            {tone}
          </StatusPill>
        ))}
        <Badge>Plain</Badge>
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
