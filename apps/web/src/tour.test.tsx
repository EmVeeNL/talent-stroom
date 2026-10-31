import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductTour } from "./tour.tsx";
import type { TourStep } from "./tour.tsx";

const steps: TourStep[] = [{ target: "[data-tour='one']", title: "tour.sidebar.title", text: "tour.sidebar.text" }];

describe("ProductTour", () => {
  it("supports keyboard skip and persists completion for this user", () => {
    vi.useFakeTimers();
    localStorage.clear();
    const onComplete = vi.fn<(result: "completed" | "skipped") => void>();
    render(
      <>
        <button data-tour="one">Doel</button>
        <ProductTour userId="synthetic-user" steps={steps} onComplete={onComplete} />
      </>,
    );
    void act(() => vi.advanceTimersByTime(350));
    expect(screen.getByRole("dialog", { name: "Navigatie" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onComplete).toHaveBeenCalledWith("skipped");
    expect(localStorage.getItem("talentstroom:tour:v1:synthetic-user")).toBe("skipped");
    vi.useRealTimers();
  });
});
