import { useId } from "react";
import type { SelectHTMLAttributes, Ref, ReactNode } from "react";
import { Icon } from "./Icon.tsx";
import { cx } from "../classnames.ts";
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  readOnly?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  ref?: Ref<HTMLSelectElement>;
  children: ReactNode;
}
export function Select({
  readOnly,
  label,
  hint,
  error,
  placeholder,
  id,
  className,
  children,
  ref,
  ...rest
}: SelectProps) {
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
      <div className="ts-select__control">
        <select
          {...rest}
          aria-readonly={readOnly || undefined}
          onMouseDown={(e) => {
            if (readOnly) e.preventDefault();
            rest.onMouseDown?.(e);
          }}
          onKeyDown={(e) => {
            if (readOnly && e.key !== "Tab") e.preventDefault();
            rest.onKeyDown?.(e);
          }}
          ref={ref}
          id={cid}
          className="ts-field__input ts-select"
          aria-invalid={error ? true : undefined}
          aria-describedby={[rest["aria-describedby"], hid, eid].filter(Boolean).join(" ") || undefined}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        {!rest.multiple && <Icon name="expand_more" size={20} />}
      </div>
      {error && (
        <p className="ts-field__error" id={eid} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
