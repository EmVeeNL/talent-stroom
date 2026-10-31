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

it("shows a countdown bar for timed toasts that pauses on hover and focus", () => {
  vi.useFakeTimers();
  const { container } = render(
    <>
      <Toast duration={5000} closeLabel="Sluiten" onDismiss={() => {}}>
        Opgeslagen
      </Toast>
      <button>Volgende</button>
    </>,
  );
  const bar = container.querySelector(".ts-toast__countdown");
  if (!bar) throw new Error("Missing countdown bar");
  expect(bar.getAttribute("aria-hidden")).toBe("true");
  expect(bar.getAttribute("data-paused")).toBe("false");
  const notice = screen.getByRole("status");
  fireEvent.mouseEnter(notice);
  expect(bar.getAttribute("data-paused")).toBe("true");
  fireEvent.mouseLeave(notice);
  expect(bar.getAttribute("data-paused")).toBe("false");
  act(() => screen.getByRole("button", { name: "Sluiten" }).focus());
  expect(bar.getAttribute("data-paused")).toBe("true");
});

it("never auto-closes a persistent toast and shows no countdown", () => {
  vi.useFakeTimers();
  const dismiss = vi.fn<() => void>();
  const { container } = render(
    <Toast persistent duration={100} closeLabel="Sluiten" onDismiss={dismiss}>
      Blijft staan
    </Toast>,
  );
  advance(60_000);
  expect(dismiss).not.toHaveBeenCalled();
  expect(container.querySelector(".ts-toast__countdown")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Sluiten" }));
  expect(dismiss).toHaveBeenCalledOnce();
});

it("can omit the icon and dismisses with Escape from inside the toast", () => {
  const dismiss = vi.fn<() => void>();
  const { container } = render(
    <Toast icon={false} duration={0} closeLabel="Sluiten" onDismiss={dismiss}>
      Alleen tekst
    </Toast>,
  );
  expect(container.querySelector(".ts-toast__message > .ts-icon")).toBeNull();
  const close = screen.getByRole("button", { name: "Sluiten" });
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(dismiss).not.toHaveBeenCalled();
  fireEvent.keyDown(close, { key: "Escape" });
  expect(dismiss).toHaveBeenCalledOnce();
});

it("stays paused while the parent holds it", () => {
  vi.useFakeTimers();
  const dismiss = vi.fn<() => void>();
  const { rerender } = render(
    <Toast paused duration={200} closeLabel="Sluiten" onDismiss={dismiss}>
      Opgeslagen
    </Toast>,
  );
  advance(1000);
  expect(dismiss).not.toHaveBeenCalled();
  rerender(
    <Toast duration={200} closeLabel="Sluiten" onDismiss={dismiss}>
      Opgeslagen
    </Toast>,
  );
  advance(250);
  expect(dismiss).toHaveBeenCalledOnce();
});
