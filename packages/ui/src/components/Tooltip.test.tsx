import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Tooltip } from "./Tooltip.tsx";
it("opens on focus and hover, remains hoverable and dismisses with Escape and blur", async () => {
  const { container } = render(
    <Tooltip content="Extra informatie" delay={0}>
      <button aria-label="Details">?</button>
    </Tooltip>,
  );
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.tab();
  await waitFor(() => expect(screen.getByText("Extra informatie")).toBeTruthy());
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByText("Extra informatie")).toBeNull();
  await userEvent.tab();
  const target = screen.getByRole("button");
  await userEvent.hover(target);
  await waitFor(() => expect(screen.getByText("Extra informatie")).toBeTruthy());
  if (target.parentElement) fireEvent.mouseLeave(target.parentElement);
  await userEvent.hover(screen.getByText("Extra informatie"));
  expect(screen.getByText("Extra informatie")).toBeTruthy();
  await userEvent.unhover(screen.getByText("Extra informatie"));
  await waitFor(() => expect(screen.queryByText("Extra informatie")).toBeNull());
});
it("preserves existing descriptions, persists during focus and hides on blur", async () => {
  const { container } = render(
    <>
      <p id="hint">Status</p>
      <Tooltip content="Details" delay={0}>
        <button aria-describedby="hint">Info</button>
      </Tooltip>
      <button>Volgende</button>
    </>,
  );
  await userEvent.tab();
  await waitFor(() => expect(screen.getByRole("tooltip")).toBeTruthy());
  const trigger = screen.getByRole("button", { name: "Info" });
  expect(trigger.getAttribute("aria-describedby")).toBe(`hint ${screen.getByRole("tooltip").id}`);
  await userEvent.hover(trigger);
  await userEvent.unhover(trigger);
  await new Promise((resolve) => setTimeout(resolve, 180));
  expect(screen.getByRole("tooltip")).toBeTruthy();
  await userEvent.tab();
  expect(screen.queryByRole("tooltip")).toBeNull();
  expect(trigger.getAttribute("aria-describedby")).toBe("hint");
  expect(await axeViolations(container)).toEqual([]);
});
it("cancels a pending delayed preview when Escape is pressed", async () => {
  render(
    <Tooltip content="Details" delay={100}>
      <button>Info</button>
    </Tooltip>,
  );
  await userEvent.tab();
  await userEvent.keyboard("{Escape}");
  await new Promise((resolve) => setTimeout(resolve, 130));
  expect(screen.queryByRole("tooltip")).toBeNull();
});
