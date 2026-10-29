import { useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "./Button.tsx";
import { Popover } from "./Popover.tsx";
export interface DateRange {
  start: Date;
  end?: Date;
}
export interface DateRangeLabels {
  previous: string;
  next: string;
  today: string;
  last7: string;
  month: string;
  hint: string;
  start: string;
  complete: string;
}
export interface DateRangePickerProps {
  label: string;
  value?: DateRange;
  onChange: (value: DateRange) => void;
  labels: DateRangeLabels;
  locale?: string;
  today?: Date;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
}
const day = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
const stamp = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
function addMonths(date: Date, amount: number) {
  const start = new Date(date.getFullYear(), date.getMonth() + amount, 1),
    last = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  return new Date(start.getFullYear(), start.getMonth(), Math.min(date.getDate(), last.getDate()));
}
export function DateRangePicker({
  label,
  value,
  onChange,
  labels,
  locale = "nl-NL",
  today = new Date(),
  disabled,
  readOnly,
  error,
}: DateRangePickerProps) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const formatted = value
    ? `${format.format(value.start)}${value.end ? ` – ${format.format(value.end)}` : ""}`
    : labels.hint;
  return (
    <div className="ts-field">
      <Popover
        initialFocus='.ts-date-range button[tabindex="0"]'
        label={label}
        trigger={
          <Button
            className="ts-date-range-trigger"
            ref={trigger}
            variant="secondary"
            trailingIcon="calendar_month"
            disabled={disabled}
            aria-disabled={readOnly || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            onClick={(e) => {
              if (readOnly) e.preventDefault();
            }}
          >
            {label}: {formatted}
          </Button>
        }
      >
        <Calendar
          {...(value ? { value } : {})}
          onChange={onChange}
          labels={labels}
          locale={locale}
          today={today}
          close={() => {
            trigger.current?.click();
            trigger.current?.focus();
          }}
        />
      </Popover>
      {error && (
        <p className="ts-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
function Calendar({
  value,
  onChange,
  labels,
  locale,
  today,
  close,
}: Omit<DateRangePickerProps, "label" | "disabled"> & { locale: string; today: Date; close: () => void }) {
  const id = useId(),
    [focus, setFocus] = useState(() => day(value?.end ?? value?.start ?? today)),
    [anchor, setAnchor] = useState<Date>(),
    [announcement, setAnnouncement] = useState(labels.hint),
    refs = useRef(new Map<string, HTMLButtonElement>()),
    restoreFocus = useRef(false);
  useLayoutEffect(() => {
    if (restoreFocus.current) {
      restoreFocus.current = false;
      refs.current.get(stamp(focus))?.focus();
    }
  }, [focus]);
  const month = new Date(focus.getFullYear(), focus.getMonth(), 1),
    offset = (month.getDay() + 6) % 7,
    first = addDays(month, -offset);
  const full = new Intl.DateTimeFormat(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    title = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(month);
  const move = (next: Date, restore = true) => {
    restoreFocus.current = restore;
    setFocus(next);
  };
  const choose = (date: Date) => {
    if (!anchor) {
      setAnchor(date);
      onChange({ start: date });
      setAnnouncement(`${labels.start}: ${full.format(date)}. ${labels.hint}`);
    } else {
      const range = anchor <= date ? { start: anchor, end: date } : { start: date, end: anchor };
      onChange(range);
      setAnchor(undefined);
      setAnnouncement(labels.complete);
      close();
    }
  };
  const preset = (start: Date, end: Date) => {
    onChange({ start: day(start), end: day(end) });
    close();
  };
  return (
    <div className="ts-date-range">
      <div className="ts-date-range__heading">
        <Button
          variant="ghost"
          icon="chevron_left"
          aria-label={labels.previous}
          onClick={() => move(addMonths(focus, -1), false)}
        />
        <span id={`${id}-month`} aria-live="polite">
          {title}
        </span>
        <Button
          variant="ghost"
          icon="chevron_right"
          aria-label={labels.next}
          onClick={() => move(addMonths(focus, 1), false)}
        />
      </div>
      <p id={`${id}-hint`} className="ts-date-range__hint" role="status">
        {announcement}
      </p>
      <table role="grid" aria-labelledby={`${id}-month`} aria-describedby={`${id}-hint`}>
        <thead>
          <tr>
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(new Date(2026, 0, 5), i);
              return (
                <th key={i} scope="col" abbr={new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date)}>
                  {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, week) => (
            <tr key={week}>
              {Array.from({ length: 7 }, (_day, weekday) => {
                const date = addDays(first, week * 7 + weekday),
                  selected = Boolean(value && date >= day(value.start) && date <= day(value.end ?? value.start)),
                  key = stamp(date);
                return (
                  <td key={key} aria-selected={selected}>
                    <button
                      type="button"
                      ref={(node) => {
                        if (node) refs.current.set(key, node);
                        else refs.current.delete(key);
                      }}
                      tabIndex={stamp(focus) === key ? 0 : -1}
                      aria-label={full.format(date)}
                      aria-current={stamp(today) === key ? "date" : undefined}
                      data-outside={date.getMonth() !== month.getMonth() || undefined}
                      data-endpoint={
                        Boolean(value && (stamp(value.start) === key || (value.end && stamp(value.end) === key))) ||
                        undefined
                      }
                      onFocus={() => setFocus(date)}
                      onClick={() => choose(date)}
                      onKeyDown={(e) => {
                        let next: Date;
                        const weekdayIndex = (date.getDay() + 6) % 7;
                        if (e.key === "ArrowRight") next = addDays(date, 1);
                        else if (e.key === "ArrowLeft") next = addDays(date, -1);
                        else if (e.key === "ArrowDown") next = addDays(date, 7);
                        else if (e.key === "ArrowUp") next = addDays(date, -7);
                        else if (e.key === "Home") next = addDays(date, -weekdayIndex);
                        else if (e.key === "End") next = addDays(date, 6 - weekdayIndex);
                        else if (e.key === "PageUp") next = addMonths(date, e.shiftKey ? -12 : -1);
                        else if (e.key === "PageDown") next = addMonths(date, e.shiftKey ? 12 : 1);
                        else return;
                        e.preventDefault();
                        move(next);
                      }}
                    >
                      {new Intl.NumberFormat(locale).format(date.getDate())}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ts-date-range__presets">
        <Button variant="ghost" size="sm" onClick={() => preset(today, today)}>
          {labels.today}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => preset(addDays(today, -6), today)}>
          {labels.last7}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            preset(
              new Date(today.getFullYear(), today.getMonth(), 1),
              new Date(today.getFullYear(), today.getMonth() + 1, 0),
            )
          }
        >
          {labels.month}
        </Button>
      </div>
    </div>
  );
}
