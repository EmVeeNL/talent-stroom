import { createElement, useId } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../classnames.ts";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  as?: "div" | "section" | "article";
  /** Optional heading. A titled `section`/`article` is labelled by it. */
  title?: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  actions?: ReactNode;
}

export function Card({ as = "div", title, headingLevel = 3, actions, className, children, ...rest }: CardProps) {
  const headingId = useId();
  const labelled = title !== undefined && as !== "div";
  return createElement(
    as,
    {
      ...rest,
      className: cx("ts-card", className),
      "aria-labelledby": labelled ? headingId : rest["aria-labelledby"],
    },
    title !== undefined || actions ? (
      <div className="ts-card__header">
        {title !== undefined
          ? createElement(`h${headingLevel}`, { id: headingId, className: "ts-card__title" }, title)
          : null}
        {actions ? <div className="ts-card__actions">{actions}</div> : null}
      </div>
    ) : null,
    <div className="ts-card__body">{children}</div>,
  );
}
