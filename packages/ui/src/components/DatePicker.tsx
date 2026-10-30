import { DateRangePicker } from "./DateRangePicker.tsx";
import type { DateRangePickerProps, DateRangeLabels } from "./DateRangePicker.tsx";

export interface DatePickerProps extends Omit<DateRangePickerProps, "value" | "onChange" | "labels" | "selectionMode"> {
  value?: Date;
  onChange: (value: Date) => void;
  labels: Pick<DateRangeLabels, "previous" | "next" | "today" | "hint">;
}
/** Single-date picker shares the range picker's Monday-first keyboard grid. */
export function DatePicker({ value, onChange, labels, ...props }: DatePickerProps) {
  return (
    <DateRangePicker
      {...props}
      selectionMode="single"
      {...(value ? { value: { start: value } } : {})}
      onChange={(range) => onChange(range.start)}
      labels={{ ...labels, last7: "", month: "", start: "", complete: "" }}
    />
  );
}
