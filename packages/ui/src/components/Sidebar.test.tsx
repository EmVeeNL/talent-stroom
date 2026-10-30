import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import type { SidebarSection } from "./Sidebar.tsx";
import { Sidebar, SidebarAssistant } from "./Sidebar.tsx";
const sections: SidebarSection[] = [
  { id: "top", items: [{ id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/" }] },
  {
    id: "recruitment",
    label: "Recruitment",
    items: [
      { id: "candidates", label: "Kandidaten", icon: "group", href: "#kandidaten" },
      { id: "vacancies", label: "Vacatures", icon: "work", soon: true },
    ],
  },
  {
    id: "activities",
    label: "Activiteiten",
    items: [{ id: "tasks", label: "Taken", icon: "task_alt", href: "#taken", count: 3, countLabel: "3 open" }],
  },
];
const props = {
  label: "Hoofdnavigatie",
  sections,
  soonLabel: "Binnenkort",
  home: { href: "/", label: "TalentStroom" },
};

it("groups sections, marks the active page and renders unfinished routes as disabled, not as links", async () => {
  const { container } = render(<Sidebar {...props} activeId="candidates" />);
  const nav = screen.getByRole("navigation", { name: "Hoofdnavigatie" });
  expect(screen.getByRole("link", { name: "Kandidaten" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("link", { name: "Dashboard" }).hasAttribute("aria-current")).toBe(false);
  expect(screen.getByRole("list", { name: "Recruitment" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Taken, 3 open" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: /Vacatures/ })).toBeNull();
  const soon = screen.getByText("Vacatures").closest("[aria-disabled]");
  expect(soon?.textContent).toContain("Binnenkort");
  expect(nav.querySelectorAll("a:not([href])")).toHaveLength(0);
  expect(await axeViolations(container)).toEqual([]);
});

it("keeps names and tooltips in the collapsed rail and dismisses a tooltip with Escape", async () => {
  const { container } = render(<Sidebar {...props} activeId="dashboard" collapsed />);
  const link = screen.getByRole("link", { name: "Kandidaten" });
  expect(link.getAttribute("href")).toBe("#kandidaten");
  await userEvent.tab();
  await userEvent.tab();
  expect(document.activeElement).toBe(screen.getByRole("link", { name: "Dashboard" }));
  link.focus();
  expect(link.querySelector(".ts-sidebar__tooltip")?.textContent).toBe("Kandidaten");
  await userEvent.keyboard("{Escape}");
  expect(link.querySelector(".ts-sidebar__tooltip")).toBeNull();
  expect(await axeViolations(container)).toEqual([]);
});

it("renders the AI assistant card, disabled until it has an action", async () => {
  const { container, rerender } = render(
    <SidebarAssistant title="AI Assistent" description="Stel een vraag…" soonLabel="Binnenkort" />,
  );
  const button = screen.getByRole("button", { name: "AI Assistent Stel een vraag…, Binnenkort" });
  expect(button.getAttribute("aria-disabled")).toBe("true");
  expect(await axeViolations(container)).toEqual([]);
  let clicked = 0;
  rerender(
    <SidebarAssistant
      title="AI Assistent"
      description="Stel een vraag…"
      soonLabel="Binnenkort"
      onClick={() => clicked++}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "AI Assistent Stel een vraag…" }));
  expect(clicked).toBe(1);
});
