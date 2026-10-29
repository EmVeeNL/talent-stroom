import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Sidebar } from "./Sidebar.tsx";
const items = [
  {
    id: "jobs",
    label: "Werving",
    icon: "work",
    children: [{ id: "candidates", label: "Kandidaten", href: "#candidates", icon: "person" }],
  },
];
it("discloses nested navigation and marks the active page", async () => {
  const { container, rerender } = render(<Sidebar label="Navigatie" items={items} activeId="candidates" />);
  expect(screen.getByRole("link").getAttribute("aria-current")).toBe("page");
  await userEvent.click(screen.getByRole("button", { name: "Werving" }));
  expect(screen.queryByRole("link")).toBeNull();
  expect(await axeViolations(container)).toEqual([]);
  rerender(<Sidebar label="Navigatie" items={items} activeId="candidates" collapsed />);
  expect(screen.getByRole("link", { name: "Kandidaten" })).toBeTruthy();
  expect(await axeViolations(container)).toEqual([]);
});
it("toggles disclosure with Space and Enter and dismisses icon labels with Escape", async () => {
  const { rerender } = render(<Sidebar label="Navigatie" items={items} activeId="candidates" />);
  await userEvent.tab();
  await userEvent.keyboard(" ");
  expect(screen.queryByRole("link")).toBeNull();
  await userEvent.keyboard("{Enter}");
  expect(screen.getByRole("link", { name: "Kandidaten" })).toBeTruthy();
  rerender(<Sidebar label="Navigatie" items={items} activeId="candidates" collapsed />);
  const link = screen.getByRole("link", { name: "Kandidaten" });
  link.focus();
  expect(link.querySelector(".ts-sidebar__tooltip")).toBeTruthy();
  await userEvent.keyboard("{Escape}");
  expect(link.querySelector(".ts-sidebar__tooltip")).toBeNull();
});
