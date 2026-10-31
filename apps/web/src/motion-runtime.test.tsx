import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, expect, it } from "vitest";
import { MotionGlobalConfig, MotionProvider } from "@talentstroom/ui";
import { App } from "./App.tsx";

afterEach(() => {
  MotionGlobalConfig.skipAnimations = true;
});
it("replays a preset in the routed dashboard shell", async () => {
  MotionGlobalConfig.skipAnimations = false;
  window.history.replaceState(null, "", "/elementen/geavanceerd?preview=dashboard");
  const { container } = render(
    <StrictMode>
      <MotionProvider>
        <App />
      </MotionProvider>
    </StrictMode>,
  );
  const replay = await screen.findAllByRole("button", { name: "Opnieuw afspelen" }, { timeout: 10_000 });
  const [first] = replay;
  if (!first) throw new Error("missing replay button");
  fireEvent.click(first);
  await waitFor(() => {
    const opacity = Number(container.querySelector<HTMLElement>(".motion-showcase-sample")?.style.opacity);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });
}, 20_000);
