import type { IconName } from "../icons.ts";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "warning";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and ignores clicks while keeping keyboard focus. */
  loading?: boolean;
  /** Visually hidden text announced while loading, e.g. "Bezig met opslaan". Pass a translated string. */
  loadingLabel?: string;
  /** Material Symbols ligature name rendered before (default) or after the label. */
  icon?: IconName;
  iconPosition?: "start" | "end";
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  ref?: Ref<HTMLButtonElement>;
}

/** Icon-only buttons require a translated accessible name. */
export type ButtonProps = ButtonBaseProps &
  ({ children: ReactNode; "aria-label"?: string } | { children?: never; "aria-label": string });

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  icon,
  iconPosition = "start",
  leadingIcon,
  trailingIcon,
  type = "button",
  className,
  children,
  onClick,
  ref,
  ...rest
}: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  const startIcon = leadingIcon ?? (iconPosition === "start" ? icon : undefined);
  const endIcon = trailingIcon ?? (iconPosition === "end" ? icon : undefined);
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={cx(
        "ts-button",
        `ts-button--${variant}`,
        `ts-button--${size}`,
        loading && "ts-button--loading",
        (children === null || children === undefined) && "ts-button--icon-only",
        className,
      )}
      aria-busy={loading || undefined}
      aria-disabled={loading || rest["aria-disabled"]}
      onClick={handleClick}
    >
      {loading ? <span className="ts-spinner" aria-hidden="true" /> : startIcon && <Icon name={startIcon} size={20} />}
      <span className="ts-button__label">{children}</span>
      {!loading && endIcon && <Icon name={endIcon} size={20} />}
      {loading && loadingLabel ? <span className="ts-visually-hidden">{loadingLabel}</span> : null}
    </button>
  );
}
