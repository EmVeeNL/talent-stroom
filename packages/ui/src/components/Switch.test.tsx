import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Switch } from "./Switch.tsx";
import { axeViolations } from "../test-utils.ts";
describe("Switch", () => {
  it("toggles immediately and exposes checked state", async () => {
    const user = userEvent.setup();
    let checked = false;
    render(
      <Switch
        label="Hybride"
        checked={checked}
        onChange={(v) => {
          checked = v;
        }}
      />,
    );
    await user.click(screen.getByRole("switch"));
    expect(checked).toBe(true);
  });
  it("passes axe", async () => {
    const { container } = render(
      <Switch label="Hybride" description="Werken op kantoor en thuis" checked onChange={() => {}} />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
