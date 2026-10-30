import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Breadcrumb } from "./Breadcrumb.tsx";
it("labels navigation and the current page", async () => {
  const { container } = render(
    <Breadcrumb label="Kruimelpad" items={[{ label: "Start", href: "#start" }, { label: "Kandidaten" }]} />,
  );
  expect(screen.getByRole("navigation", { name: "Kruimelpad" })).toBeTruthy();
  expect(screen.getByText("Kandidaten").getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("link", { name: "Start" }).getAttribute("href")).toBe("#start");
  expect(await axeViolations(container)).toEqual([]);
});
