import type { ButtonHTMLAttributes, MouseEvent, Ref } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and ignores clicks while keeping keyboard focus. */
  loading?: boolean;
  /** Visually hidden text announced while loading, e.g. "Bezig met opslaan". Pass a translated string. */
  loadingLabel?: string;
  /** Material Symbols ligature name rendered before (default) or after the label. */
  icon?: string;
  iconPosition?: "start" | "end";
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  icon,
  iconPosition = "start",
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
  const iconNode = icon ? <Icon name={icon} size={20} /> : null;
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
        className,
      )}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
    >
      {loading ? <span className="ts-spinner" aria-hidden="true" /> : iconPosition === "start" && iconNode}
      <span className="ts-button__label">{children}</span>
      {!loading && iconPosition === "end" && iconNode}
      {loading && loadingLabel ? <span className="ts-visually-hidden">{loadingLabel}</span> : null}
    </button>
  );
}
