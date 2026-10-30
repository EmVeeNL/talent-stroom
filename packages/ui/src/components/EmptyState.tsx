import { useId } from "react";
import type { ReactNode } from "react";
import type { IconName } from "../icons.ts";
import { Icon } from "./Icon.tsx";
export interface EmptyStateProps {
  variant?: "no-records" | "no-results" | "error";
  icon?: IconName;
  title: string;
  body: string;
  action?: ReactNode;
  /** Dense variant for use inside a column or panel. */
  compact?: boolean;
}
export function EmptyState({ variant = "no-records", icon, title, body, action, compact = false }: EmptyStateProps) {
  const id = useId();
  return (
    <section
      className={`ts-empty-state ts-empty-state--${variant}${compact ? " ts-empty-state--compact" : ""}`}
      role={variant === "error" ? "alert" : undefined}
      aria-labelledby={id}
    >
      <span className="ts-empty-state__icon">
        <Icon
          size={compact ? 24 : 32}
          name={icon ?? (variant === "error" ? "error" : variant === "no-results" ? "person_search" : "group_add")}
        />
      </span>
      <h3 id={id}>{title}</h3>
      <p>{body}</p>
      {action && <div className="ts-empty-state__action">{action}</div>}
    </section>
  );
}
