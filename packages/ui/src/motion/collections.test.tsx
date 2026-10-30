import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadDomMax } from "./dom-max.tsx";
import { MotionGlobalConfig, MotionProvider } from "./provider.tsx";
import { MotionCollection, MotionContent, MotionListItem, MotionTableRow } from "./collections.tsx";

afterEach(() => document.documentElement.removeAttribute("data-motion"));

const list = (ids: string[]) => (
  <MotionProvider>
    <ul>
      <MotionCollection>
        {ids.map((id) => (
          <MotionListItem key={id}>
            <button>{id}</button>
          </MotionListItem>
        ))}
      </MotionCollection>
    </ul>
  </MotionProvider>
);

const content = (identity: string) => (
  <MotionProvider>
    <MotionContent identity={identity}>
      <h1 ref={(node) => node?.focus()} tabIndex={-1}>
        {identity}
      </h1>
      <input aria-label="Edit" />
    </MotionContent>
  </MotionProvider>
);

describe("collection and content motion", () => {
  it("removes transforms for reduced motion and preserves focus through reordering", async () => {
    document.documentElement.dataset["motion"] = "reduce";
    const view = render(list(["one", "two"]));
    await act(async () => {
      await loadDomMax();
    });
    const button = screen.getByRole("button", { name: "one" });
    button.focus();
    view.rerender(list(["two", "one", "three"]));
    expect(document.activeElement).toBe(button);
    for (const item of screen.getAllByRole("listitem")) expect(item.style.transform).toBe("");
    view.rerender(list(["one", "three"]));
    await waitFor(() => expect(screen.queryByRole("button", { name: "two" })).toBeNull());
    expect(document.activeElement).toBe(button);
  });

  it("makes an exiting item inert immediately while its visual exit finishes", async () => {
    MotionGlobalConfig.skipAnimations = false;
    try {
      const view = render(list(["one", "two"]));
      await act(async () => {
        await loadDomMax();
      });
      view.rerender(list(["one"]));
      const exiting = screen.getByText("two").closest("li");
      expect(exiting?.hasAttribute("inert")).toBe(true);
      expect(exiting?.getAttribute("aria-hidden")).toBe("true");
      expect(screen.queryByRole("button", { name: "two" })).toBeNull();
      expect(screen.getByRole("button", { name: "one" }).hasAttribute("disabled")).toBe(false);
    } finally {
      MotionGlobalConfig.skipAnimations = true;
    }
  });

  it("keeps native table semantics when rows change", () => {
    render(
      <MotionProvider>
        <table>
          <tbody>
            <MotionCollection>
              <MotionTableRow>
                <td>Row</td>
              </MotionTableRow>
            </MotionCollection>
          </tbody>
        </table>
      </MotionProvider>,
    );
    expect(screen.getByRole("cell").parentElement?.tagName).toBe("TR");
  });

  it("never waits for content motion before heading focus or input", () => {
    document.documentElement.dataset["motion"] = "reduce";
    const view = render(content("first"));
    view.rerender(content("second"));
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "second" }));
    expect(screen.getByRole("heading").parentElement?.style.transform).toBe("");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "immediate" } });
    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("immediate");
    expect(screen.queryByText("first")).toBeNull();
  });
});
