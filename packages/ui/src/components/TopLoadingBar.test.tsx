import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TopLoadingBar } from "./TopLoadingBar.tsx";

afterEach(() => vi.useRealTimers());
it("delays progress, completes and disappears, and ignores short loads", () => {
  vi.useFakeTimers();
  const { rerender } = render(<TopLoadingBar loading label="Laden" />);
  expect(screen.queryByRole("progressbar")).toBeNull();
  void act(() => vi.advanceTimersByTime(150));
  expect(screen.getByRole("progressbar", { name: "Laden" })).toBeTruthy();
  rerender(<TopLoadingBar loading={false} label="Laden" />);
  expect(screen.getByRole("progressbar").getAttribute("data-state")).toBe("complete");
  void act(() => vi.advanceTimersByTime(400));
  expect(screen.queryByRole("progressbar")).toBeNull();
  rerender(<TopLoadingBar loading label="Laden" />);
  void act(() => vi.advanceTimersByTime(100));
  rerender(<TopLoadingBar loading={false} label="Laden" />);
  void act(() => vi.advanceTimersByTime(500));
  expect(screen.queryByRole("progressbar")).toBeNull();
});
it("respects the shared reduced-motion override", () => {
  vi.useFakeTimers();
  document.documentElement.setAttribute("data-motion", "reduce");
  const { unmount } = render(<TopLoadingBar loading label="Laden" />);
  void act(() => vi.advanceTimersByTime(150));
  expect(screen.getByRole("progressbar").getAttribute("data-reduced-motion")).toBe("true");
  unmount();
  document.documentElement.removeAttribute("data-motion");
});
