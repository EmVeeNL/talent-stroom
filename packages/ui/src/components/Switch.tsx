import { useId } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cx } from "../classnames.ts";
export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  label: string;
  description?: string;
  checked: boolean;
  readOnly?: boolean;
  onChange: (checked: boolean) => void;
}
export function Switch({ label, description, checked, onChange, readOnly, id, className, ...rest }: SwitchProps) {
  const uid = useId(),
    cid = id ?? uid,
    did = description ? `${cid}-description` : undefined;
  return (
    <div className={cx("ts-switch", className)}>
      <button
        {...rest}
        id={cid}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-readonly={readOnly || undefined}
        aria-describedby={did}
        className="ts-switch__control"
        onClick={() => {
          if (!readOnly) onChange(!checked);
        }}
      >
        <span className="ts-switch__track" aria-hidden="true">
          <span />
        </span>
        <span className="ts-switch__label">{label}</span>
      </button>
      {description && (
        <p className="ts-field__hint" id={did}>
          {description}
        </p>
      )}
    </div>
  );
}
