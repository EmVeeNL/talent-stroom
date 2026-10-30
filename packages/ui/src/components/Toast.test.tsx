import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Toast } from "./Toast.tsx";

const tones = ["info", "success", "warning", "danger"] as const;

// Fake timers and synchronous events keep the auto-dismiss deterministic: a slow axe
// run or a busy CI runner must not let the 200 ms timer fire before hover or focus pauses it.
const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

afterEach(() => {
  vi.useRealTimers();
});

it.each(tones)("announces %s accessibly", async (tone) => {
  const { container } = render(
    <Toast tone={tone} closeLabel="Sluiten" onDismiss={() => {}} duration={0}>
      Opgeslagen
    </Toast>,
  );
  expect(screen.getByRole(tone === "danger" ? "alert" : "status")).toBeDefined();
  expect(await axeViolations(container)).toEqual([]);
});

it.each(tones)("pauses %s while hovered and supports close", (tone) => {
  vi.useFakeTimers();
  const dismiss = vi.fn<() => void>();
  render(
    <Toast tone={tone} closeLabel="Sluiten" onDismiss={dismiss} duration={200}>
      Opgeslagen
    </Toast>,
  );
  const notice = screen.getByRole(tone === "danger" ? "alert" : "status");
  fireEvent.mouseEnter(notice);
  advance(1000);
  expect(dismiss).not.toHaveBeenCalled();
  fireEvent.mouseLeave(notice);
  advance(250);
  expect(dismiss).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "Sluiten" }));
  expect(dismiss).toHaveBeenCalledTimes(2);
});

it("pauses on keyboard focus independently of hover", () => {
  vi.useFakeTimers();
  const dismiss = vi.fn<() => void>();
  render(
    <>
      <Toast duration={200} closeLabel="Sluiten" onDismiss={dismiss}>
        Opgeslagen
      </Toast>
      <button>Volgende</button>
    </>,
  );
  act(() => screen.getByRole("button", { name: "Sluiten" }).focus());
  advance(1000);
  expect(dismiss).not.toHaveBeenCalled();
  act(() => screen.getByRole("button", { name: "Volgende" }).focus());
  advance(250);
  expect(dismiss).toHaveBeenCalledOnce();
});
