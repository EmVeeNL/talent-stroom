import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { axeViolations } from "../test-utils.ts";
import { AlertBanner } from "./AlertBanner.tsx";
it.each(["info", "success", "warning", "danger"] as const)(
  "exposes %s text, icon, action and dismiss",
  async (tone) => {
    const dismiss = vi.fn<() => void>();
    const { container } = render(
      <AlertBanner tone={tone} dismissLabel="Sluiten" onDismiss={dismiss} action={<button>Opnieuw</button>}>
        Melding
      </AlertBanner>,
    );
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByText("Sluiten"));
    expect(dismiss).toHaveBeenCalledOnce();
  },
);
