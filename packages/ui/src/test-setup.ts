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

// Charts render through a lazily imported TanStack Charts view. Importing that module can take
// longer than Testing Library's default findBy timeout on a busy machine, so load it once up front;
// React.lazy then resolves from the module cache and chart tests no longer race the import.
await import("./components/TanStackChartView.tsx");
