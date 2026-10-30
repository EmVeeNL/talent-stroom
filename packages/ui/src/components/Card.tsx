import { createElement, useId } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { ContextMenu } from "./ContextMenu.tsx";
import type { ContextMenuItem } from "./ContextMenu.tsx";
import { Skeleton } from "./Skeleton.tsx";
import { cx } from "../classnames.ts";
import { MotionPanel, MotionPresence } from "../motion/presence.tsx";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  as?: "div" | "section" | "article";
  /** Optional heading. A titled `section`/`article` is labelled by it. */
  title?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  actions?: ReactNode;
  headerActions?: ReactNode;
  subtitle?: ReactNode;
  variant?: "default" | "kpi" | "data" | "widget";
  selected?: boolean;
  loading?: boolean;
  menuItems?: readonly ContextMenuItem[];
  /** Localized by the caller, typically “Meer acties”. Required when providing menu items. */
  menuLabel?: string;
}

export function Card({
  as = "div",
  title,
  headingLevel = 3,
  actions,
  headerActions,
  subtitle,
  variant = "default",
  selected = false,
  loading = false,
  menuItems,
  menuLabel,
  className,
  children,
  ...rest
}: CardProps) {
  const headingId = useId();
  const labelled = title !== undefined && as !== "div";
  return createElement(
    as,
    {
      ...rest,
      className: cx("ts-card", `ts-card--${variant}`, className),
      "data-selected": selected || undefined,
      "aria-busy": loading || undefined,
      "aria-labelledby": labelled ? headingId : rest["aria-labelledby"],
    },
    title !== undefined || actions || headerActions || (menuItems?.length && menuLabel) ? (
      <div className="ts-card__header">
        <div className="ts-card__heading">
          {title !== undefined
            ? createElement(`h${headingLevel}`, { id: headingId, className: "ts-card__title" }, title)
            : null}
          {subtitle && <p className="ts-card__subtitle">{subtitle}</p>}
        </div>
        {actions || headerActions || (menuItems?.length && menuLabel) ? (
          <div className="ts-card__actions">
            {headerActions ?? actions}
            {!!menuItems?.length && menuLabel && <ContextMenu triggerLabel={menuLabel} items={menuItems} />}
          </div>
        ) : null}
      </div>
    ) : null,
    <div className="ts-card__body">
      <MotionPresence>
        <MotionPanel
          key={loading ? "loading" : "content"}
          initial="initial"
          animate="animate"
          exit="exit"
          preset="fade"
        >
          {loading ? <Skeleton shape="card" /> : children}
        </MotionPanel>
      </MotionPresence>
    </div>,
  );
}
