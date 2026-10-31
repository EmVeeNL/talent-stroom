import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { afterEach, expect, it } from "vitest";
import { MotionGlobalConfig, m, MotionProvider } from "./provider.tsx";
import { getMotionPreset } from "./presets.ts";
import { Card } from "../components/Card.tsx";

function Replay() {
  const [key, setKey] = useState(0);
  const preset = getMotionPreset("slideUp");
  return (
    <Card>
      <button onClick={() => setKey(key + 1)}>Replay</button>
      <m.div
        key={key}
        data-testid="sample"
        initial="initial"
        animate="animate"
        variants={preset.variants}
        transition={{ duration: 1 }}
      />
    </Card>
  );
}
afterEach(() => {
  MotionGlobalConfig.skipAnimations = true;
});
it("lets descendants replay inside a Card's presence boundary in StrictMode", async () => {
  MotionGlobalConfig.skipAnimations = false;
  render(
    <StrictMode>
      <MotionProvider>
        <Replay />
      </MotionProvider>
    </StrictMode>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Replay" }));
  await waitFor(() => {
    const opacity = Number(screen.getByTestId("sample").style.opacity);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });
});
