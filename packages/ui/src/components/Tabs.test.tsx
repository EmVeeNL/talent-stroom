import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { MotionProvider } from "../motion/index.ts";
import { Tabs } from "./Tabs.tsx";

const tabs = [
  { id: "one", label: "Eén", panel: <p>Paneel 1</p> },
  { id: "two", label: "Twee", panel: <p>Paneel 2</p> },
  { id: "three", label: "Drie", panel: <p>Paneel 3</p>, disabled: true },
  { id: "four", label: "Vier", panel: <p>Paneel 4</p> },
];

function selectedTab() {
  return screen.getAllByRole("tab").find((tab) => tab.getAttribute("aria-selected") === "true");
}

describe("Tabs", () => {
  it("wires tablist, tabs and panels per the WAI-ARIA pattern", () => {
    render(<Tabs tabs={tabs} label="Kandidaat" />);
    expect(screen.getByRole("tablist", { name: "Kandidaat" })).toBeTruthy();
    const first = screen.getByRole("tab", { name: "Eén" });
    const panel = screen.getByRole("tabpanel");
    expect(first.getAttribute("aria-selected")).toBe("true");
    expect(first.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(first.id);
    expect(panel.textContent).toBe("Paneel 1");
    expect(screen.getByRole("tab", { name: "Twee" }).tabIndex).toBe(-1);
  });

  it("moves with ArrowRight/ArrowLeft, wraps, and skips disabled tabs", async () => {
    render(<Tabs tabs={tabs} label="Kandidaat" />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Eén" }));
    await userEvent.keyboard("{ArrowRight}");
    expect(selectedTab()?.textContent).toBe("Twee");
    expect(document.activeElement).toBe(selectedTab());
    await userEvent.keyboard("{ArrowRight}");
    expect(selectedTab()?.textContent).toBe("Vier");
    await userEvent.keyboard("{ArrowRight}");
    expect(selectedTab()?.textContent).toBe("Eén");
    await userEvent.keyboard("{ArrowLeft}");
    expect(selectedTab()?.textContent).toBe("Vier");
    expect(screen.getByRole("tabpanel").textContent).toBe("Paneel 4");
  });

  it("supports Home and End", async () => {
    render(<Tabs tabs={tabs} label="Kandidaat" defaultSelectedId="two" />);
    await userEvent.tab();
    await userEvent.keyboard("{End}");
    expect(selectedTab()?.textContent).toBe("Vier");
    await userEvent.keyboard("{Home}");
    expect(selectedTab()?.textContent).toBe("Eén");
  });

  it("selects on click, ignores disabled tabs and reports changes", async () => {
    const onChange = vi.fn<(id: string) => void>();
    render(<Tabs tabs={tabs} label="Kandidaat" onChange={onChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "Twee" }));
    expect(onChange).toHaveBeenCalledWith("two");
    await userEvent.click(screen.getByRole("tab", { name: "Drie" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("Tab key moves from the selected tab into the panel", async () => {
    render(<Tabs tabs={tabs} label="Kandidaat" />);
    await userEvent.tab();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("tabpanel"));
  });

  it("supports controlled selection", async () => {
    const onChange = vi.fn<(id: string) => void>();
    render(<Tabs tabs={tabs} label="Kandidaat" selectedId="one" onChange={onChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "Twee" }));
    expect(onChange).toHaveBeenCalledWith("two");
    expect(selectedTab()?.textContent).toBe("Eén");
  });

  it("has no axe violations", async () => {
    const { container } = render(<Tabs tabs={tabs} label="Kandidaat" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

it.each([false, true])(
  "aligns the indicator after selection and resize without delaying focus (reduced=%s)",
  async (reduced) => {
    if (reduced) document.documentElement.dataset["motion"] = "reduce";
    let resize: ResizeObserverCallback | undefined;
    const disconnect = vi.fn<() => void>();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback;
        }
        observe = vi.fn<() => void>();
        unobserve = vi.fn<() => void>();
        disconnect = disconnect;
      },
    );
    let width = 100;
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      return new DOMRect(this.textContent === "Twee" ? 100 : 0, 0, width, 40);
    });
    const { container, unmount } = render(
      <MotionProvider>
        <Tabs tabs={tabs} label="Kandidaat" />
      </MotionProvider>,
    );
    await userEvent.click(screen.getByRole("tab", { name: "Twee" }));
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Twee" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("Paneel 2");
    expect(container.querySelector(".ts-tabs__indicator")?.getAttribute("aria-hidden")).toBe("true");
    width = 150;
    act(() => resize?.([], { observe() {}, unobserve() {}, disconnect() {} }));
    await waitFor(() =>
      expect(container.querySelector<HTMLElement>(".ts-tabs__indicator")?.style.transform).toContain("scaleX(150)"),
    );
    unmount();
    expect(disconnect).toHaveBeenCalled();
    document.documentElement.removeAttribute("data-motion");
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  },
);
