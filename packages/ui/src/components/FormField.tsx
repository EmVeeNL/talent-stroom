import { useId } from "react";
import type { ReactNode } from "react";
import { cx } from "../classnames.ts";
export interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id?: string;
  className?: string;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}
export function FormField({ label, hint, error, required, id, className, children }: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cx("ts-field", error && "ts-field--invalid", className)}>
      <label className="ts-field__label" htmlFor={controlId}>
        {label}
        {required && (
          <span className="ts-field__required" aria-hidden="true">
            {" *"}
          </span>
        )}
      </label>
      {hint && (
        <p className="ts-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {children({ id: controlId, describedBy, invalid: Boolean(error) })}
      {error && (
        <p className="ts-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
export function FormLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="ts-field__label" htmlFor={htmlFor}>
      {children}
      {required && (
        <span className="ts-field__required" aria-hidden="true">
          {" *"}
        </span>
      )}
    </label>
  );
}
export function FormHint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className="ts-field__hint" id={id}>
      {children}
    </p>
  );
}
export function FormMessage({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p className="ts-field__error" id={id} role="alert">
      {children}
    </p>
  );
}
