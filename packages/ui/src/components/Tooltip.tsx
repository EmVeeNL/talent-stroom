import { cloneElement, useId } from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { cx } from "../classnames.ts";
import { useFloating, usePreview } from "./floating.ts";
export interface TooltipProps {
  /** One focusable element; essential information must remain available without this preview. */
  children: ReactElement<HTMLAttributes<HTMLElement>>;
  content: ReactNode;
  delay?: number;
  className?: string;
}
export function Tooltip({ children, content, delay = 300, className }: TooltipProps) {
  const id = useId();
  const preview = usePreview(delay);
  const { anchor, panel, position } = useFloating(preview.open);
  return (
    <span
      ref={anchor}
      className="ts-preview-anchor"
      onMouseEnter={preview.show}
      onMouseLeave={preview.leave}
      onFocus={preview.focus}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) preview.blur();
      }}
    >
      {cloneElement(children, {
        "aria-describedby":
          [children.props["aria-describedby"], preview.open ? id : undefined].filter(Boolean).join(" ") || undefined,
      })}
      {preview.open && (
        <div
          ref={panel}
          id={id}
          role="tooltip"
          className={cx("ts-tooltip", className)}
          style={position}
          onMouseEnter={preview.enter}
          onMouseLeave={preview.leave}
        >
          {content}
        </div>
      )}
    </span>
  );
}
