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

it("only exposes caller-supplied actions and replaces loading content with skeletons", () => {
  const { container, rerender } = render(<Card title="Statisch">Inhoud</Card>);
  expect(screen.queryByRole("button")).toBeNull();
  rerender(
    <Card
      variant="widget"
      selected
      loading
      title="Pipeline"
      menuLabel="Meer acties"
      menuItems={[{ id: "refresh", label: "Vernieuwen", onSelect: () => {} }]}
    >
      Inhoud
    </Card>,
  );
  expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  expect(container.querySelector(".ts-skeleton")).toBeTruthy();
  expect(screen.queryByText("Inhoud")).toBeNull();
  expect(screen.getByRole("button", { name: "Meer acties" })).toBeTruthy();
});
