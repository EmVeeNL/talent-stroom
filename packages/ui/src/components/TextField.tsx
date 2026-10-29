import { useId } from "react";
import type { InputHTMLAttributes, Ref } from "react";
import { cx } from "../classnames.ts";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  /** Error message. When set the input gets aria-invalid and the message joins aria-describedby. */
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  hint,
  error,
  required,
  id,
  className,
  "aria-describedby": describedByProp,
  ref,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [describedByProp, hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("ts-field", error && "ts-field--invalid", className)}>
      <label className="ts-field__label" htmlFor={inputId}>
        {label}
        {required ? (
          <span className="ts-field__required" aria-hidden="true">
            {" *"}
          </span>
        ) : null}
      </label>
      {hint ? (
        <p className="ts-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <input
        {...rest}
        ref={ref}
        id={inputId}
        className="ts-field__input"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {error ? (
        <p className="ts-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
