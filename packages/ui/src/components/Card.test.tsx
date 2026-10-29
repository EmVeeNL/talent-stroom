import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Card } from "./Card.tsx";

describe("Card", () => {
  it("labels a titled section by its heading", () => {
    render(
      <Card as="section" title="Pipeline" headingLevel={2}>
        Inhoud
      </Card>,
    );
    const region = screen.getByRole("region", { name: "Pipeline" });
    expect(region.textContent).toContain("Inhoud");
    expect(screen.getByRole("heading", { level: 2, name: "Pipeline" })).toBeTruthy();
  });

  it("renders without a title and passes axe", async () => {
    const { container } = render(
      <div>
        <Card>Zonder titel</Card>
        <Card as="article" title="Titel" actions={<button type="button">Actie</button>}>
          Met titel
        </Card>
      </div>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
