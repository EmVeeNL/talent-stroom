/** Date helpers on ISO calendar dates (yyyy-mm-dd) in local time; no time zones involved. */

const pad = (value: number) => String(value).padStart(2, "0");

export function fromIso(iso: string): Date {
  const [year = 1970, month = 1, day = 1] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const date = fromIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

/** Adds months and keeps the day inside the target month (31 January + 1 month = 28 February). */
export function addMonths(iso: string, months: number): string {
  const date = fromIso(iso);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, last));
  return toIso(date);
}

/** Monday of the week containing the date. */
export function startOfWeek(iso: string): string {
  return addDays(iso, -((fromIso(iso).getDay() + 6) % 7));
}

export function weekDays(iso: string): string[] {
  const start = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** Weeks (Monday first) that cover the month of the given date. */
export function monthWeeks(iso: string): string[][] {
  const first = `${iso.slice(0, 7)}-01`;
  const lastDay = new Date(fromIso(first).getFullYear(), fromIso(first).getMonth() + 1, 0).getDate();
  const last = `${iso.slice(0, 7)}-${pad(lastDay)}`;
  const weeks: string[][] = [];
  for (let start = startOfWeek(first); start <= last; start = addDays(start, 7)) weeks.push(weekDays(start));
  return weeks;
}

export function sameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}
