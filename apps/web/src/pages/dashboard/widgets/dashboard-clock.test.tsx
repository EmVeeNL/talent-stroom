import { act, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DashboardBreadcrumbs } from "./DashboardWidgets.tsx";

const format = (locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(new Date());

afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, "", "/");
});
it("formats the live browser clock in the active locale and advances every minute", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-03T19:15:00Z"));
  const { container, rerender } = render(<DashboardBreadcrumbs locale="nl-NL">path</DashboardBreadcrumbs>);
  const time = container.querySelector("time");
  expect(time?.dateTime).toBe(new Date().toISOString());
  expect(time?.textContent).toContain(format("nl-NL"));
  act(() => {
    vi.advanceTimersByTime(60_000);
  });
  expect(time?.dateTime).toBe("2026-11-03T19:16:00.000Z");
  rerender(<DashboardBreadcrumbs locale="en-GB">path</DashboardBreadcrumbs>);
  expect(time?.textContent).toContain(format("en-GB"));
});
it("injects a fixed preview clock with a fixed timezone", () => {
  vi.useFakeTimers();
  window.history.replaceState(null, "", "/?preview=dashboard");
  const { container } = render(<DashboardBreadcrumbs locale="nl-NL">path</DashboardBreadcrumbs>);
  expect(container.querySelector("time")?.textContent).toContain("14:32");
  act(() => {
    vi.advanceTimersByTime(120_000);
  });
  expect(container.querySelector("time")?.dateTime).toBe("2026-10-30T13:32:00.000Z");
});
