import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { DateRange } from "./DateRangePicker.tsx";
import { DateRangePicker } from "./DateRangePicker.tsx";
import { axeViolations } from "../test-utils.ts";

describe("DateRangePicker", () => {
  it("navigates the Monday date grid, clamps month changes and selects a range", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: DateRange) => void>();
    const { container } = render(
      <DateRangePicker
        label="Periode"
        value={{ start: new Date(2026, 0, 31) }}
        onChange={change}
        today={new Date(2026, 0, 31)}
        labels={{
          previous: "Vorige maand",
          next: "Volgende maand",
          today: "Vandaag",
          last7: "Laatste 7 dagen",
          month: "Deze maand",
          hint: "Kies begin- en einddatum",
          start: "Begindatum gekozen",
          complete: "Periode gekozen",
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Periode/ }));
    const day = screen.getByRole("button", { name: "zaterdag 31 januari 2026" });
    day.focus();
    await user.keyboard("{PageDown}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("zaterdag 28 februari 2026");
    await user.keyboard("{Home}");
    expect(document.activeElement?.getAttribute("aria-label")).toContain("maandag 23");
    await user.keyboard("{End}{Enter}{ArrowLeft}{Enter}");
    expect(change).toHaveBeenCalled();
    expect(await axeViolations(container)).toEqual([]);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("grid")).toBeNull();
  });
  it.each([
    ["Vandaag", 29, 29],
    ["Laatste 7 dagen", 23, 29],
    ["Deze maand", 1, 31],
  ] as const)("selects the %s preset and restores trigger focus", async (preset, start, end) => {
    const user = userEvent.setup(),
      change = vi.fn<(range: DateRange) => void>();
    const { container } = render(
      <DateRangePicker
        label="Periode"
        onChange={change}
        today={new Date(2026, 9, 29)}
        labels={{
          previous: "Vorige maand",
          next: "Volgende maand",
          today: "Vandaag",
          last7: "Laatste 7 dagen",
          month: "Deze maand",
          hint: "Kies een periode",
          start: "Begin gekozen",
          complete: "Periode gekozen",
        }}
      />,
    );
    const trigger = screen.getByRole("button", { name: /Periode/ });
    await user.click(trigger);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("donderdag 29 oktober 2026");
    expect(screen.getAllByRole("columnheader")[0]?.getAttribute("abbr")).toBe("maandag");
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: preset }));
    expect(change).toHaveBeenLastCalledWith({ start: new Date(2026, 9, start), end: new Date(2026, 9, end) });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
  it("orders a reverse selection and crosses year boundaries using grid keys", async () => {
    const user = userEvent.setup(),
      change = vi.fn<(range: DateRange) => void>();
    const { container } = render(
      <DateRangePicker
        label="Periode"
        onChange={change}
        today={new Date(2026, 0, 1)}
        labels={{
          previous: "Vorige maand",
          next: "Volgende maand",
          today: "Vandaag",
          last7: "Laatste 7 dagen",
          month: "Deze maand",
          hint: "Kies een periode",
          start: "Begin gekozen",
          complete: "Periode gekozen",
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Periode/ }));
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement?.getAttribute("aria-label")).toBe("donderdag 25 december 2025");
    await user.keyboard("{ArrowDown}{Enter}{ArrowLeft}{Enter}");
    expect(change).toHaveBeenLastCalledWith({ start: new Date(2025, 11, 31), end: new Date(2026, 0, 1) });
    expect(await axeViolations(container)).toEqual([]);
  });
});
