import { cloneElement, useId } from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { cx } from "../classnames.ts";
import { useFloating, usePreview } from "./floating.ts";
export interface TooltipProps {
  /** One focusable element; essential information must remain available without this preview. */
  children: ReactElement<HTMLAttributes<HTMLElement>>;
  /** Always-visible in-flow gallery example. */
  inline?: boolean;
  content: ReactNode;
  delay?: number;
  className?: string;
}
export function Tooltip({ children, content, delay = 300, className, inline = false }: TooltipProps) {
  const id = useId();
  const preview = usePreview(delay);
  const { anchor, panel, position } = useFloating(preview.open && !inline);
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
          [children.props["aria-describedby"], inline || preview.open ? id : undefined].filter(Boolean).join(" ") ||
          undefined,
      })}
      {(inline || preview.open) && (
        <div
          ref={panel}
          id={id}
          role="tooltip"
          className={cx("ts-tooltip", className)}
          style={inline ? { position: "static" } : position}
          onMouseEnter={preview.enter}
          onMouseLeave={preview.leave}
        >
          {content}
        </div>
      )}
    </span>
  );
}
