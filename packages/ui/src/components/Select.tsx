import { useId } from "react";
import type { SelectHTMLAttributes, Ref, ReactNode } from "react";
import { cx } from "../classnames.ts";
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  ref?: Ref<HTMLSelectElement>;
  children: ReactNode;
}
export function Select({ label, hint, error, placeholder, id, className, children, ref, ...rest }: SelectProps) {
  const uid = useId(),
    cid = id ?? uid,
    hid = hint ? `${cid}-hint` : undefined,
    eid = error ? `${cid}-error` : undefined;
  return (
    <div className={cx("ts-field", error && "ts-field--invalid", className)}>
      <label className="ts-field__label" htmlFor={cid}>
        {label}
        {rest.required && (
          <span className="ts-field__required" aria-hidden="true">
            {" *"}
          </span>
        )}
      </label>
      {hint && (
        <p className="ts-field__hint" id={hid}>
          {hint}
        </p>
      )}
      <select
        {...rest}
        ref={ref}
        id={cid}
        className="ts-field__input ts-select"
        aria-invalid={error ? true : undefined}
        aria-describedby={[rest["aria-describedby"], hid, eid].filter(Boolean).join(" ") || undefined}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      {error && (
        <p className="ts-field__error" id={eid} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
