import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { AnimatePresence, MotionProvider } from "../motion/index.ts";
import { FilterChip } from "./FilterChip.tsx";
import { Sidebar } from "./Sidebar.tsx";
import { StatCard } from "./StatCard.tsx";

const { animate, stop } = vi.hoisted(() => ({
  animate: vi.fn<(...args: unknown[]) => { stop: () => void }>(),
  stop: vi.fn<() => void>(),
}));
vi.mock("../motion/index.ts", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  animate: animate.mockReturnValue({ stop }),
}));
afterEach(() => {
  document.documentElement.removeAttribute("data-motion");
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("counts and draws only on first intersection, retains final text and cancels on new data", () => {
  let intersect: ((entries: Pick<IntersectionObserverEntry, "isIntersecting">[]) => void) | undefined;
  const disconnect = vi.fn<() => void>();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = (entries) =>
          callback(
            entries.map((entry) => ({
              ...entry,
              boundingClientRect: new DOMRect(),
              intersectionRect: new DOMRect(),
              intersectionRatio: entry.isIntersecting ? 1 : 0,
              rootBounds: null,
              target: document.body,
              time: 0,
            })),
            this,
          );
      }
      root = null;
      rootMargin = "0px";
      scrollMargin = "0px";
      thresholds = [0];
      unobserve = vi.fn<() => void>();
      takeRecords = () => [];
      observe = vi.fn<() => void>();
      disconnect = disconnect;
    },
  );
  const { container, rerender, unmount } = render(
    <StatCard label="Omzet" value={1234.5} sparkline={{ values: [1, 2], label: "Groei" }} />,
  );
  expect(animate).not.toHaveBeenCalled();
  expect(container.querySelector(".ts-stat-card__value")?.textContent).toBe("1.234,5");
  act(() => intersect?.([{ isIntersecting: false }]));
  expect(animate).not.toHaveBeenCalled();
  act(() => intersect?.([{ isIntersecting: true }]));
  expect(animate).toHaveBeenCalledTimes(2);
  expect(animate).toHaveBeenNthCalledWith(1, 0, 1234.5, expect.objectContaining({ duration: 0.32 }));
  act(() => intersect?.([{ isIntersecting: true }]));
  expect(animate).toHaveBeenCalledTimes(2);
  expect(disconnect).toHaveBeenCalled();
  expect(container.querySelector(".ts-visually-hidden")?.textContent).toContain("1.234,5");
  rerender(<StatCard label="Omzet" value={2000} sparkline={{ values: [2, 3], label: "Groei" }} />);
  expect(stop).toHaveBeenCalled();
  expect(animate).toHaveBeenCalledTimes(2);
  expect(container.querySelector(".ts-stat-card__value")?.textContent).toBe("2.000");
  unmount();
});

it.each(["os", "override", "unsupported"])(
  "skips StatCard motion for %s and displays fractional final values",
  (mode) => {
    const observer = vi.fn<() => void>();
    vi.stubGlobal("IntersectionObserver", mode === "unsupported" ? undefined : observer);
    if (mode === "override") document.documentElement.dataset["motion"] = "reduce";
    if (mode === "os")
      vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    const { container } = render(
      <StatCard label="Score" value={12.5} sparkline={{ values: [1, 2], label: "Groei" }} />,
    );
    expect(animate).not.toHaveBeenCalled();
    expect(observer).not.toHaveBeenCalled();
    expect(container.querySelector(".ts-stat-card__value")?.textContent).toBe("12,5");
    expect(container.querySelector("polyline")?.getAttribute("stroke-dashoffset")).not.toBe("1");
  },
);

it.each([false, true])(
  "sidebar disclosure is immediately inaccessible on close and reverses (reduced=%s)",
  async (reduced) => {
    if (reduced) document.documentElement.dataset["motion"] = "reduce";
    const sections = [
      {
        id: "apps",
        label: "Apps",
        icon: "dashboard" as const,
        expandable: true,
        nested: true,
        items: [{ id: "tasks", label: "Taken", icon: "task_alt" as const, href: "/taken", active: true }],
      },
    ];
    const { container, rerender } = render(
      <MotionProvider>
        <Sidebar label="Navigatie" soonLabel="Binnenkort" sections={sections} />
      </MotionProvider>,
    );
    const toggle = screen.getByRole("button", { name: "Apps" });
    await userEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("link", { name: "Taken" })).toBeNull();
    expect(container.querySelector("[inert]")).toBeTruthy();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("link", { name: "Taken" })).toBeTruthy();
    expect(document.activeElement).toBe(toggle);
    rerender(
      <MotionProvider>
        <Sidebar label="Navigatie" soonLabel="Binnenkort" sections={sections} collapsed />
      </MotionProvider>,
    );
    expect(screen.getByRole("link", { name: "Taken" })).toBeTruthy();
    expect(document.activeElement).toBe(toggle);
  },
);

function Chips() {
  const [visible, setVisible] = useState(true);
  return (
    <>
      <button onClick={() => setVisible((value) => !value)}>Wissel</button>
      <AnimatePresence>
        {visible && (
          <FilterChip key="chip" kind="removable" removeLabel="Verwijder" onRemove={() => setVisible(false)}>
            Functie
          </FilterChip>
        )}
      </AnimatePresence>
    </>
  );
}
it.each([false, true])(
  "filter chips enter, become inert on exit and can be added again (reduced=%s)",
  async (reduced) => {
    if (reduced) document.documentElement.dataset["motion"] = "reduce";
    render(
      <MotionProvider>
        <Chips />
      </MotionProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Verwijder" }));
    expect(screen.queryByRole("button", { name: "Verwijder" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Wissel" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Verwijder" })).toBeTruthy());
  },
);
