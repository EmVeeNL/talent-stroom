import { cloneElement, useEffect, useId, useState } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cx } from "../classnames.ts";
import { focusable, useFloating } from "./floating.ts";
export interface PopoverProps {
  trigger: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  label: string;
  children: ReactNode;
  className?: string;
  /** Selector inside the panel to focus on opening; defaults to the first control. */
  initialFocus?: string;
}
export function Popover({ trigger, label, children, className, initialFocus }: PopoverProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const { anchor, panel, position } = useFloating(open);
  useEffect(() => {
    if (!open) return undefined;
    const node = panel.current;
    node?.showPopover?.();
    (node?.querySelector<HTMLElement>(initialFocus ?? focusable) ?? node)?.focus();
    const close = () => {
      setOpen(false);
      anchor.current?.querySelector<HTMLElement>(focusable)?.focus();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    const outside = (event: MouseEvent) => {
      if (event.target instanceof Node && !anchor.current?.contains(event.target) && !node?.contains(event.target))
        close();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("click", outside);
    return () => {
      // Removing a native popover already closes it; detached nodes reject hidePopover().
      if (node?.isConnected) node.hidePopover?.();
      document.removeEventListener("keydown", key);
      document.removeEventListener("click", outside);
    };
  }, [open, anchor, panel, initialFocus]);
  return (
    <span ref={anchor} className="ts-preview-anchor">
      {cloneElement(trigger, {
        "aria-expanded": open,
        "aria-controls": id,
        "aria-haspopup": "dialog",
        onClick: (event) => {
          trigger.props.onClick?.(event);
          if (!event.defaultPrevented) setOpen(!open);
        },
      })}
      {open && (
        <div
          ref={panel}
          id={id}
          popover={typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype ? "manual" : undefined}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          className={cx("ts-popover", className)}
          style={position}
        >
          {children}
        </div>
      )}
    </span>
  );
}
