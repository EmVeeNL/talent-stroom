import { act, render, screen, waitFor } from "@testing-library/react";
import { MotionGlobalConfig } from "motion/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "./provider.tsx";
import { getMotionPreset, motionPresets } from "./presets.ts";
import type { MotionPresetName } from "./presets.ts";
import { useReducedMotion } from "./reduced-motion.ts";

function ReducedMotionProbe() {
  const reduced = useReducedMotion();
  return <output>{reduced ? "reduced" : "full"}</output>;
}

function MediaProbe() {
  const reduced = useReducedMotion();
  return <output>{reduced ? "reduced" : "full"}</output>;
}
const createMedia = (matches: boolean): MediaQueryList => ({
  matches,
  media: "(prefers-reduced-motion: reduce)",
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
});

afterEach(() => {
  document.documentElement.removeAttribute("data-motion");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const presetNames: MotionPresetName[] = [
  "fade",
  "slideUp",
  "slideDown",
  "slideLeft",
  "slideRight",
  "scaleIn",
  "collapse",
  "expand",
  "listItem",
  "popover",
  "dialog",
  "sheetLeft",
  "sheetRight",
  "toast",
];

describe("motion foundation", () => {
  it("combines the OS reduced-motion preference and the HTML override", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn<Window["matchMedia"]>(() => createMedia(false)),
    );
    render(<ReducedMotionProbe />);
    expect(screen.getByRole("status").textContent).toBe("full");
    act(() => {
      document.documentElement.dataset["motion"] = "reduce";
    });
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("reduced"));
  });

  it("honours prefers-reduced-motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn<Window["matchMedia"]>(() => createMedia(true)),
    );
    render(<MediaProbe />);
    expect(screen.getByRole("status").textContent).toBe("reduced");
  });

  it("removes transform-based motion in reduced-motion presets", () => {
    for (const name of ["slideUp", "slideDown", "slideLeft", "slideRight", "scaleIn", "listItem"] as const) {
      const preset = getMotionPreset(name, true);
      expect(preset.variants["initial"]).not.toHaveProperty("x");
      expect(preset.variants["initial"]).not.toHaveProperty("y");
      expect(preset.variants["initial"]).not.toHaveProperty("scale");
      expect(preset.variants["animate"]).not.toHaveProperty("x");
      expect(preset.variants["animate"]).not.toHaveProperty("y");
      expect(preset.variants["animate"]).not.toHaveProperty("scale");
    }
  });

  it("provides the shared Motion configuration around children", () => {
    render(
      <MotionProvider>
        <span>motion ready</span>
      </MotionProvider>,
    );
    expect(screen.getByText("motion ready").textContent).toBe("motion ready");
    expect(MotionGlobalConfig.skipAnimations).toBe(true);
  });

  it("provides each named preset and removes movement when reduced", () => {
    expect(Object.keys(motionPresets)).toEqual([
      "fade",
      "slideUp",
      "slideDown",
      "slideLeft",
      "slideRight",
      "scaleIn",
      "collapse",
      "expand",
      "listItem",
      "popover",
      "dialog",
      "sheetLeft",
      "sheetRight",
      "toast",
    ]);
    expect(getMotionPreset("slideUp").variants["initial"]).toMatchObject({ y: 8 });
    for (const name of presetNames) {
      const reduced = getMotionPreset(name, true);
      for (const state of Object.values(reduced.variants)) {
        expect(state).not.toHaveProperty("x");
        expect(state).not.toHaveProperty("y");
        expect(state).not.toHaveProperty("scale");
      }
      expect(reduced.transition.duration).toBe(name === "fade" ? 0.12 : 0);
    }
  });
});
