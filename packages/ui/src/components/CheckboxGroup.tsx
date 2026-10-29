import type { ReactNode } from "react";
import { cx } from "../classnames.ts";
export function CheckboxGroup({
  legend,
  children,
  hint,
  error,
  className,
}: {
  legend: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  className?: string;
}) {
  return (
    <fieldset className={cx("ts-choice-group", className)}>
      <legend className="ts-field__label">{legend}</legend>
      {hint && <p className="ts-field__hint">{hint}</p>}
      <div className="ts-choice-group__items">{children}</div>
      {error && (
        <p className="ts-field__error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
