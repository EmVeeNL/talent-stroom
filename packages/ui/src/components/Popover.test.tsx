import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { domAnimation, LazyMotion, MotionGlobalConfig } from "motion/react";
import { axeViolations } from "../test-utils.ts";
import { Popover } from "./Popover.tsx";
it("moves focus into interactive content and restores it on Escape and outside click", async () => {
  const { container } = render(
    <>
      <Popover label="Acties" trigger={<button>Open</button>}>
        <button>Bewerken</button>
      </Popover>
      <button>Buiten</button>
    </>,
  );
  expect(await axeViolations(container)).toEqual([]);
  const trigger = screen.getByRole("button", { name: "Open" });
  await userEvent.click(trigger);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Bewerken" }));
  expect(await axeViolations(container)).toEqual([]);
  await userEvent.keyboard("{Escape}");
  expect(document.activeElement).toBe(trigger);
  await userEvent.click(trigger);
  await userEvent.click(screen.getByText("Buiten"));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});
it("uses the native API when supported and safely unmounts an open popover", async () => {
  let opened = 0;
  Object.defineProperty(HTMLElement.prototype, "showPopover", {
    configurable: true,
    value: function (this: HTMLElement) {
      opened++;
      this.style.display = "block";
    },
  });
  Object.defineProperty(HTMLElement.prototype, "hidePopover", {
    configurable: true,
    value: function (this: HTMLElement) {
      if (!this.isConnected) throw new Error("Disconnected popover");
    },
  });
  try {
    const { container, unmount } = render(
      <Popover label="Acties" trigger={<button>Open</button>}>
        <button>Bewerken</button>
      </Popover>,
    );
    await userEvent.click(screen.getByText("Open"));
    expect(opened).toBe(1);
    expect(screen.getByRole("dialog").getAttribute("popover")).toBe("manual");
    expect(await axeViolations(container)).toEqual([]);
    unmount();
  } finally {
    Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
    Reflect.deleteProperty(HTMLElement.prototype, "hidePopover");
  }
});

afterEach(() => {
  MotionGlobalConfig.skipAnimations = true;
  document.documentElement.removeAttribute("data-motion");
  vi.restoreAllMocks();
});

it.each(["Escape", "outside"])("returns focus immediately on %s while the native panel exits", async (action) => {
  MotionGlobalConfig.skipAnimations = false;
  const show = vi.fn<(this: HTMLElement) => void>(function (this: HTMLElement) {
    this.style.display = "block";
  });
  const hide = vi.fn<() => void>();
  Object.defineProperty(HTMLElement.prototype, "showPopover", { configurable: true, value: show });
  Object.defineProperty(HTMLElement.prototype, "hidePopover", { configurable: true, value: hide });
  try {
    render(
      <LazyMotion features={domAnimation}>
        <Popover label="Acties" trigger={<button>Open</button>}>
          <button>Bewerken</button>
        </Popover>
        <button>Buiten</button>
      </LazyMotion>,
    );
    const trigger = screen.getByText("Open");
    fireEvent.click(trigger);
    const panel = screen.getByRole("dialog");
    expect(show).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByText("Bewerken"));
    if (action === "Escape") fireEvent.keyDown(screen.getByText("Bewerken"), { key: "Escape" });
    else fireEvent.click(screen.getByText("Buiten"));
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(panel.isConnected).toBe(true);
    expect(panel.hasAttribute("inert")).toBe(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(hide).not.toHaveBeenCalled();
    await waitFor(() => expect(panel.isConnected).toBe(false));
    expect(hide).toHaveBeenCalledTimes(1);
  } finally {
    Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
    Reflect.deleteProperty(HTMLElement.prototype, "hidePopover");
  }
});

it.each(["OS", "override"])("hides and unmounts immediately under reduced motion (%s)", (source) => {
  MotionGlobalConfig.skipAnimations = false;
  if (source === "override") document.documentElement.dataset["motion"] = "reduce";
  else
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  const hide = vi.fn<() => void>();
  Object.defineProperty(HTMLElement.prototype, "showPopover", {
    configurable: true,
    value: function (this: HTMLElement) {
      this.style.display = "block";
    },
  });
  Object.defineProperty(HTMLElement.prototype, "hidePopover", { configurable: true, value: hide });
  try {
    render(
      <LazyMotion features={domAnimation}>
        <Popover label="Acties" trigger={<button>Open</button>}>
          <button>Bewerken</button>
        </Popover>
      </LazyMotion>,
    );
    const trigger = screen.getByText("Open");
    fireEvent.click(trigger);
    const panel = screen.getByRole("dialog");
    fireEvent.keyDown(screen.getByText("Bewerken"), { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
    expect(panel.isConnected).toBe(false);
    expect(hide).toHaveBeenCalledTimes(1);
  } finally {
    Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
    Reflect.deleteProperty(HTMLElement.prototype, "hidePopover");
  }
});
