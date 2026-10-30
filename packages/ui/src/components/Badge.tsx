import type { IconName } from "../icons.ts";
import type { HTMLAttributes } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
import { RECRUITMENT_STAGES } from "../recruitment-stages.ts";
import type { RecruitmentStageId, RecruitmentStageTone } from "../recruitment-stages.ts";

export type BadgeTone = RecruitmentStageTone;
export type BadgeVariant = "subtle" | "solid";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  icon?: IconName;
  dot?: boolean;
}

const solidTones = new Set<BadgeTone>(["neutral", "info", "danger"]);

export function Badge({
  tone = "neutral",
  variant = "subtle",
  icon,
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  const safeVariant = variant === "solid" && solidTones.has(tone) ? "solid" : "subtle";
  return (
    <span {...rest} className={cx("ts-badge", `ts-badge--${tone}`, `ts-badge--${safeVariant}`, className)}>
      {icon && <Icon name={icon} size={16} />}
      {dot && <span className="ts-badge__dot" aria-hidden="true" />}
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
  violet: "handshake",
  accent: "send",
  custom: "star",
};

/** Status indicator: tone is conveyed by text and a per-tone icon, never by colour alone. */
export function StatusPill({ tone = "neutral", className, children, icon, ...rest }: BadgeProps) {
  return (
    <Badge {...rest} tone={tone} icon={icon ?? toneIcons[tone]} className={cx("ts-badge--pill", className)}>
      {children}
    </Badge>
  );
}

export interface StageBadgeProps extends Omit<BadgeProps, "tone" | "icon"> {
  stage: RecruitmentStageId;
}

/** Stage label content is supplied by the caller using the exported i18n label key. */
export function StageBadge({ stage, ...props }: StageBadgeProps) {
  const definition = RECRUITMENT_STAGES[stage];
  return <StatusPill {...props} tone={definition.tone} icon={definition.icon} />;
}
