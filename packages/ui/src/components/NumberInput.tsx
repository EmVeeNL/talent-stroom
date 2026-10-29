import React, { useId } from "react";
import type { InputHTMLAttributes, Ref } from "react";
import { cx } from "../classnames.ts";
export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange"
> {
  label: string;
  hint?: string;
  error?: string;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  ref?: Ref<HTMLInputElement>;
  decrementLabel: string;
  incrementLabel: string;
}
export function NumberInput({
  label,
  hint,
  error,
  id,
  className,
  min,
  max,
  step = 1,
  value,
  defaultValue,
  onChange,
  ref,
  decrementLabel,
  incrementLabel,
  ...rest
}: NumberInputProps) {
  const uid = useId(),
    cid = id ?? uid;
  const [internal, setInternal] = React.useState(defaultValue ?? Number(min ?? 0));
  const current = value ?? internal;
  const numericMin = min === undefined ? -Infinity : Number(min);
  const numericMax = max === undefined ? Infinity : Number(max);
  const numericStep = Number(step);
  const hid = hint ? `${cid}-hint` : undefined,
    eid = error ? `${cid}-error` : undefined;
  const update = (n: number) => {
    const next = Math.min(numericMax, Math.max(numericMin, n));
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };
  return (
    <div className={cx("ts-field", error && "ts-field--invalid", className)}>
      <label className="ts-field__label" htmlFor={cid}>
        {label}
      </label>
      {hint && (
        <p className="ts-field__hint" id={hid}>
          {hint}
        </p>
      )}
      <div className="ts-number">
        <button
          type="button"
          aria-label={decrementLabel}
          disabled={rest.disabled || current <= numericMin}
          onClick={() => update(current - numericStep)}
        >
          −
        </button>
        <input
          {...rest}
          ref={ref}
          id={cid}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(e) => {
            const n = e.currentTarget.valueAsNumber;
            if (Number.isFinite(n)) update(n);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              update(current + numericStep);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              update(current - numericStep);
            }
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hid, eid].filter(Boolean).join(" ") || undefined}
          className="ts-field__input"
        />
        <button
          type="button"
          aria-label={incrementLabel}
          disabled={rest.disabled || current >= numericMax}
          onClick={() => update(current + numericStep)}
        >
          +
        </button>
      </div>
      <span className="ts-field__hint">{new Intl.NumberFormat("nl-NL").format(current)}</span>
      {error && (
        <p className="ts-field__error" id={eid} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
