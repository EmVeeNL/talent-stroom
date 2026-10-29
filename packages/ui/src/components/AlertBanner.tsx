import type { ReactNode } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
import { Button } from "./Button.tsx";
export type FeedbackTone = "info" | "success" | "warning" | "danger";
export const feedbackIcons = { info: "info", success: "check_circle", warning: "warning", danger: "error" };
export interface AlertBannerProps {
  tone?: FeedbackTone;
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}
export function AlertBanner({ tone = "info", children, action, onDismiss, dismissLabel, className }: AlertBannerProps) {
  return (
    <div className={cx("ts-alert-banner", `ts-alert-banner--${tone}`, className)}>
      <Icon name={feedbackIcons[tone]} />
      <div className="ts-alert-banner__text">{children}</div>
      {action}
      {onDismiss && dismissLabel && (
        <Button variant="ghost" onClick={onDismiss}>
          {dismissLabel}
        </Button>
      )}
    </div>
  );
}
