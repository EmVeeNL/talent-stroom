import type { IconName } from "../icons.ts";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
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
