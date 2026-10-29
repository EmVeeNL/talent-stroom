import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
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
