import { useId } from "react";
import type { InputHTMLAttributes, CSSProperties } from "react";
import { cx } from "../classnames.ts";
export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  readOnly?: boolean;
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
  readOnly,
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
  const progress = `${Math.max(0, Math.min(100, max === min ? 0 : ((value - min) / (max - min)) * 100))}%`;
  const style: CSSProperties & { "--ts-slider-progress": string } = { "--ts-slider-progress": progress };
  return (
    <div className={cx("ts-field", error && "ts-field--invalid", className)}>
      <label className="ts-field__label" htmlFor={cid}>
        {label}
      </label>
      {hint && (
        <p className="ts-field__hint" id={`${cid}-hint`}>
          {hint}
        </p>
      )}
      <div className="ts-slider__control" style={style}>
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
          onChange={(e) => {
            if (!readOnly) onChange(Number(e.currentTarget.value));
          }}
          onPointerDown={(e) => {
            if (readOnly) e.preventDefault();
            rest.onPointerDown?.(e);
          }}
          onKeyDown={(e) => {
            if (readOnly && e.key !== "Tab") e.preventDefault();
            rest.onKeyDown?.(e);
          }}
          aria-readonly={readOnly || undefined}
          aria-valuetext={formatValue(value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [rest["aria-describedby"], hint && `${cid}-hint`, error && `${cid}-error`].filter(Boolean).join(" ") ||
            undefined
          }
        />
      </div>
      <div className="ts-slider__limits">
        <span>{minLabel ?? min}</span>
        <span>{maxLabel ?? max}</span>
      </div>
      {error && (
        <p className="ts-field__error" id={`${cid}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
