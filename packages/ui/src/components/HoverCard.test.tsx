import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { HoverCard } from "./HoverCard.tsx";
it("opens on focus and hover, remains hoverable and dismisses with Escape and blur", async () => {
  const { container } = render(
    <HoverCard content="Extra informatie" delay={0}>
      <a href="#profile">Sam</a>
    </HoverCard>,
  );
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.tab();
  await waitFor(() => expect(screen.getByText("Extra informatie")).toBeTruthy());
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByText("Extra informatie")).toBeNull();
  await userEvent.tab();
  const target = screen.getByRole("link");
  await userEvent.hover(target);
  await waitFor(() => expect(screen.getByText("Extra informatie")).toBeTruthy());
  if (target.parentElement) fireEvent.mouseLeave(target.parentElement);
  await userEvent.hover(screen.getByText("Extra informatie"));
  expect(screen.getByText("Extra informatie")).toBeTruthy();
  await userEvent.unhover(screen.getByText("Extra informatie"));
  await waitFor(() => expect(screen.queryByText("Extra informatie")).toBeNull());
});
