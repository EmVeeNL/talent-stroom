import { useId, useRef, useEffect } from "react";
import type { InputHTMLAttributes, Ref } from "react";
import { cx } from "../classnames.ts";
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
  error?: string;
  indeterminate?: boolean;
  ref?: Ref<HTMLInputElement>;
}
export function Checkbox({ label, description, error, indeterminate, id, className, ref, ...rest }: CheckboxProps) {
  const uid = useId(),
    cid = id ?? uid,
    did = description ? `${cid}-description` : undefined,
    local = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (local.current) local.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);
  return (
    <>
      <label className={cx("ts-check", className)}>
        <input
          {...rest}
          ref={(node) => {
            local.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          aria-invalid={error ? true : rest["aria-invalid"]}
          aria-readonly={rest.readOnly || undefined}
          onClick={(e) => {
            if (rest.readOnly) e.preventDefault();
            rest.onClick?.(e);
          }}
          onChange={(e) => {
            if (!rest.readOnly) rest.onChange?.(e);
          }}
          type="checkbox"
          id={cid}
          aria-describedby={
            [rest["aria-describedby"], did, error ? `${cid}-error` : undefined].filter(Boolean).join(" ") || undefined
          }
        />
        <span className="ts-check__visual" aria-hidden="true" />
        <span>
          <span className="ts-check__label">{label}</span>
          {description && (
            <span className="ts-field__hint" id={did}>
              {description}
            </span>
          )}
        </span>
      </label>
      {error && (
        <p id={`${cid}-error`} className="ts-field__error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
