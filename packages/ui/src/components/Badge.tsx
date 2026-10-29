import type { IconName } from "../icons.ts";
import type { HTMLAttributes } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <span {...rest} className={cx("ts-badge", `ts-badge--${tone}`, className)}>
      {children}
    </span>
  );
}

const toneIcons: Record<BadgeTone, IconName> = {
  neutral: "circle",
  success: "check_circle",
  warning: "warning",
  danger: "error",
  info: "info",
};

/** Status indicator: tone is conveyed by text and a per-tone icon, never by colour alone. */
export function StatusPill({ tone = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <Badge {...rest} tone={tone} className={cx("ts-badge--pill", className)}>
      <Icon name={toneIcons[tone]} size={16} filled />
      {children}
    </Badge>
  );
}
