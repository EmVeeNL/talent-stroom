import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cx } from "../classnames.ts";
export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  formatValue?: (value: number) => string;
  hint?: string;
  error?: string;
}
export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  minLabel,
  maxLabel,
  formatValue = (n) => String(n),
  hint,
  error,
  id,
  className,
  ...rest
}: SliderProps) {
  const uid = useId(),
    cid = id ?? uid;
  return (
    <div className={cx("ts-field", error && "ts-field--invalid", className)}>
      <label className="ts-field__label" htmlFor={cid}>
        {label}
      </label>
      {hint && <p className="ts-field__hint">{hint}</p>}
      <output className="ts-slider__value" htmlFor={cid}>
        {formatValue(value)}
      </output>
      <input
        {...rest}
        id={cid}
        className="ts-slider"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        aria-valuetext={formatValue(value)}
        aria-invalid={error ? true : undefined}
      />
      <div className="ts-slider__limits">
        <span>{minLabel ?? min}</span>
        <span>{maxLabel ?? max}</span>
      </div>
      {error && (
        <p className="ts-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
