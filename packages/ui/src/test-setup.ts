import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { MotionGlobalConfig } from "motion/react";

afterEach(() => {
  cleanup();
});
MotionGlobalConfig.skipAnimations = true;
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }),
  });
}
