import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import RecruitmentPage from "./Recruitment.tsx";

it("places the date beside the breadcrumbs and the action beside the greeting", () => {
  const { container } = render(<RecruitmentPage locale="nl-NL" />);
  const breadcrumbs = screen.getByRole("navigation", { name: "Broodkruimelpad" });
  const date = container.querySelector("time");
  expect(breadcrumbs.closest(".demo-dashboard__breadcrumbs")?.contains(date)).toBe(true);
  const heading = screen.getByRole("heading", { level: 1 });
  const action = screen.getByRole("button", { name: /Nieuwe kandidaat/ });
  expect(heading.closest(".demo-dashboard__welcome")?.contains(action)).toBe(true);
  expect(heading.closest(".demo-dashboard__welcome")?.contains(date)).toBe(false);
});
