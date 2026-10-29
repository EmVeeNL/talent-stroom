import { useId, useState } from "react";
import type { TextareaHTMLAttributes, Ref } from "react";
import { cx } from "../classnames.ts";
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  autoGrow?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}
export function Textarea({
  label,
  hint,
  error,
  required,
  maxLength,
  autoGrow,
  id,
  className,
  ref,
  "aria-describedby": external,
  ...rest
}: TextareaProps) {
  const uid = useId();
  const [count, setCount] = useState(String(rest.value ?? rest.defaultValue ?? "").length);
  const cid = id ?? uid;
  const hid = hint ? `${cid}-hint` : undefined;
  const eid = error ? `${cid}-error` : undefined;
  const counter = maxLength !== undefined ? `${cid}-count` : undefined;
  const described = [external, hid, eid, counter].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("ts-field", error && "ts-field--invalid", className)}>
      <label className="ts-field__label" htmlFor={cid}>
        {label}
        {required && (
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
      <textarea
        {...rest}
        ref={ref}
        id={cid}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={described}
        className={cx("ts-field__input", "ts-textarea", autoGrow && "ts-textarea--grow")}
        onInput={(e) => {
          setCount(e.currentTarget.value.length);
          rest.onInput?.(e);
          if (autoGrow) {
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
          }
        }}
      />
      {maxLength !== undefined && (
        <span className="ts-field__hint ts-textarea__count" id={counter} aria-live="polite">
          {count} / {maxLength}
        </span>
      )}
      {error && (
        <p className="ts-field__error" id={eid} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
