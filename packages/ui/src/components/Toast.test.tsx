import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { Toast } from "./Toast.tsx";
it.each(["info", "success", "warning", "danger"] as const)(
  "announces %s, pauses while hovered and supports close",
  async (tone) => {
    const dismiss = vi.fn<() => void>();
    const { container } = render(
      <Toast tone={tone} closeLabel="Sluiten" onDismiss={dismiss} duration={200}>
        Opgeslagen
      </Toast>,
    );
    const notice = screen.getByRole(tone === "danger" ? "alert" : "status");
    await userEvent.hover(notice);
    expect(await axeViolations(container)).toEqual([]);
    await new Promise((resolve) => setTimeout(resolve, 220));
    expect(dismiss).not.toHaveBeenCalled();
    await userEvent.unhover(notice);
    await waitFor(() => expect(dismiss).toHaveBeenCalled());
    await userEvent.click(screen.getByText("Sluiten"));
  },
);
it("pauses on keyboard focus independently of hover", async () => {
  const dismiss = vi.fn<() => void>();
  const { container } = render(
    <>
      <Toast duration={200} closeLabel="Sluiten" onDismiss={dismiss}>
        Opgeslagen
      </Toast>
      <button>Volgende</button>
    </>,
  );
  await userEvent.tab();
  expect(await axeViolations(container)).toEqual([]);
  await new Promise((resolve) => setTimeout(resolve, 220));
  expect(dismiss).not.toHaveBeenCalled();
  await userEvent.tab();
  await waitFor(() => expect(dismiss).toHaveBeenCalledOnce());
});
