import { useId } from "react";
import { cx } from "../classnames.ts";
import type { BadgeTone } from "./Badge.tsx";
export interface ProgressProps {
  label: string;
  value?: number;
  min?: number;
  max?: number;
  tone?: BadgeTone;
  formatValue?: (value: number) => string;
}
export function Progress({ label, value, min = 0, max = 100, tone = "info", formatValue }: ProgressProps) {
  const id = useId(),
    upper = Math.max(min + 1, max),
    current = value === undefined ? undefined : Math.max(min, Math.min(upper, value));
  const percent = current === undefined ? undefined : ((current - min) / (upper - min)) * 100;
  return (
    <div className={cx("ts-progress", `ts-progress--${tone}`, current === undefined && "ts-progress--indeterminate")}>
      <div className="ts-progress__label">
        <span id={id}>{label}</span>
        {current !== undefined && (
          <span>
            {formatValue
              ? formatValue(current)
              : new Intl.NumberFormat("nl-NL", { style: "percent", maximumFractionDigits: 0 }).format(
                  (percent ?? 0) / 100,
                )}
          </span>
        )}
      </div>
      <div
        className="ts-progress__track"
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={min}
        aria-valuemax={upper}
        aria-valuenow={current}
      >
        <span className="ts-progress__fill" style={{ width: current === undefined ? "35%" : `${percent}%` }} />
      </div>
    </div>
  );
}
