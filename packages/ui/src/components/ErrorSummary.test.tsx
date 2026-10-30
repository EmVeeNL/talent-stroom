import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ErrorSummary } from "./ErrorSummary.tsx";
import { axeViolations } from "../test-utils.ts";

describe("ErrorSummary", () => {
  it("only focuses after submit, links to controls and passes axe", async () => {
    const errors = [{ id: "title", label: "Titel", message: "Verplicht" }];
    const content = (focusRequest: number) => (
      <>
        <ErrorSummary title="Controleer de velden" errors={errors} focusRequest={focusRequest} />
        <label htmlFor="title">Titel</label>
        <input id="title" />
      </>
    );
    const { rerender, container } = render(content(0));
    const summary = screen.getByRole("region");
    expect(document.activeElement).not.toBe(summary);
    rerender(content(1));
    expect(document.activeElement).toBe(summary);
    await userEvent.click(screen.getByRole("link", { name: "Titel: Verplicht" }));
    expect(document.activeElement).toBe(screen.getByLabelText("Titel"));
    expect(await axeViolations(container)).toEqual([]);
    rerender(content(2));
    expect(document.activeElement).toBe(summary);
  });
});
