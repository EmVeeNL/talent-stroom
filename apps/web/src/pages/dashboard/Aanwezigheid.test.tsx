import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AanwezigheidPage from "./Aanwezigheid.tsx";

describe("AanwezigheidPage", () => {
  it("updates a leave request locally after approval", () => {
    render(<AanwezigheidPage locale="nl-NL" />);
    const approve = screen.getAllByRole("button", { name: "Goedkeuren" })[0];
    if (!approve) throw new Error("Missing approve button");
    fireEvent.click(approve);
    expect(screen.getByText("Goedgekeurd")).toBeTruthy();
  });
  it("updates a leave request locally after denial", () => {
    render(<AanwezigheidPage locale="nl-NL" />);
    const deny = screen.getAllByRole("button", { name: "Weigeren" })[0];
    if (!deny) throw new Error("Missing deny button");
    fireEvent.click(deny);
    expect(screen.getByText("Afgewezen")).toBeTruthy();
  });
});
