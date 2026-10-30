import { describe, expect, it } from "vitest";
import { addDays, addMonths, monthWeeks, startOfWeek, weekDays } from "./dates.ts";

describe("agenda dates", () => {
  it("starts weeks on Monday", () => {
    expect(startOfWeek("2026-10-30")).toBe("2026-10-26");
    expect(startOfWeek("2026-11-01")).toBe("2026-10-26");
    expect(weekDays("2026-10-30")[6]).toBe("2026-11-01");
  });

  it("builds whole weeks around a month", () => {
    const weeks = monthWeeks("2026-10-15");
    expect(weeks).toHaveLength(5);
    expect(weeks[0]?.[0]).toBe("2026-09-28");
    expect(weeks.at(-1)?.[6]).toBe("2026-11-01");
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it("keeps the day inside shorter months and crosses year ends", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});
