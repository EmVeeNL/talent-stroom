import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ActivityFeed } from "./ActivityFeed.tsx";
import { axeViolations } from "../test-utils.ts";

describe("ActivityFeed", () => {
  it("orders events newest first with semantic and relative times", async () => {
    const { container } = render(
      <ActivityFeed
        label="Activiteit"
        now={new Date("2026-10-29T12:00:00Z")}
        items={[
          { id: "a", actor: "Sam Voorbeeld", action: "voegde een notitie toe", date: new Date("2026-10-29T10:00:00Z") },
          { id: "b", actor: "Robin Demo", action: "plaatste een kandidaat", date: new Date("2026-10-29T11:00:00Z") },
        ]}
      />,
    );
    expect(screen.getAllByRole("listitem")[0]?.textContent).toContain("Robin");
    expect(container.querySelector("time")?.textContent).toContain("1 uur geleden");
    expect(await axeViolations(container)).toEqual([]);
  });
});
