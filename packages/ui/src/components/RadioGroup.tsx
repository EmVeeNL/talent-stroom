import { useId } from "react";
import { cx } from "../classnames.ts";
export interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  hint?: string;
  error?: string;
  card?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
export function RadioGroup({
  label,
  options,
  value,
  onChange,
  name,
  hint,
  error,
  card = false,
  readOnly,
  disabled,
}: RadioGroupProps) {
  const id = useId(),
    groupName = name ?? id;
  return (
    <fieldset
      className={cx("ts-choice-group", error && "ts-field--invalid")}
      aria-describedby={
        [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined].filter(Boolean).join(" ") || undefined
      }
      role="radiogroup"
      aria-readonly={readOnly || undefined}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
    >
      <legend className="ts-field__label">{label}</legend>
      {hint && (
        <p className="ts-field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <div className="ts-radio-group">
        {options.map((o) => (
          <label
            key={o.value}
            className={cx(
              "ts-radio-option",
              card && "ts-radio-option--card",
              o.disabled && "ts-radio-option--disabled",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={o.value}
              checked={value === undefined ? undefined : value === o.value}
              disabled={disabled || o.disabled}
              onClick={(e) => {
                if (readOnly) e.preventDefault();
              }}
              onKeyDown={(e) => {
                if (readOnly && e.key !== "Tab") e.preventDefault();
              }}
              onChange={() => {
                if (!readOnly) onChange?.(o.value);
              }}
            />
            <span className="ts-radio-option__content">
              <span>{o.label}</span>
              {o.description && <span className="ts-field__hint">{o.description}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="ts-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
