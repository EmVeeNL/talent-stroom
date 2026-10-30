import { useId, useState } from "react";
import type { InputHTMLAttributes, Ref, ReactNode } from "react";
import { Button } from "./Button.tsx";
import { Icon } from "./Icon.tsx";
import { cx } from "../classnames.ts";
import type { IconName } from "../icons.ts";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  /** Translated password toggle labels. Omit to keep a plain password field. */
  visibilityLabels?: { show: string; hide: string };
  leadingIcon?: IconName;
  shortcut?: ReactNode;
  hint?: string;
  /** Error message. When set the input gets aria-invalid and the message joins aria-describedby. */
  error?: string;
  ref?: Ref<HTMLInputElement>;
}

export function TextField({
  label,
  type = "text",
  visibilityLabels,
  leadingIcon,
  shortcut,
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
  const [visible, setVisible] = useState(false);
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
      <div
        className={cx(
          "ts-field__control",
          type === "search" && "ts-field__control--search",
          leadingIcon && "ts-field__control--leading",
          type === "date" && "ts-field__control--date",
          Boolean(shortcut || (type === "password" && visibilityLabels)) && "ts-field__control--trailing",
        )}
      >
        {leadingIcon && <Icon name={leadingIcon} size={20} />}
        {type === "search" && <Icon name="search" size={20} />}
        <input
          {...rest}
          type={type === "password" && visible ? "text" : type}
          ref={ref}
          id={inputId}
          className="ts-field__input"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {type === "password" && visibilityLabels && (
          <Button
            variant="ghost"
            size="sm"
            icon={visible ? "visibility_off" : "visibility"}
            aria-label={visible ? visibilityLabels.hide : visibilityLabels.show}
            aria-pressed={visible}
            disabled={rest.disabled}
            onClick={() => setVisible(!visible)}
          />
        )}
        {type === "date" && (
          <span className="ts-field__calendar">
            <Icon name="calendar_month" size={20} />
          </span>
        )}
        {shortcut && <span className="ts-field__shortcut">{shortcut}</span>}
      </div>
      {error ? (
        <p className="ts-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
