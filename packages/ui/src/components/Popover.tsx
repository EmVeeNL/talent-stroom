import { cloneElement, useEffect, useId, useState } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cx } from "../classnames.ts";
import { MotionPanel, MotionPresence } from "../motion/presence.tsx";
import { focusable, useFloating } from "./floating.ts";
export interface PopoverProps {
  /** Always-visible in-flow gallery example; does not capture focus. */
  inline?: boolean;
  trigger: ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  label: string;
  children: ReactNode;
  className?: string;
  /** Selector inside the panel to focus on opening; defaults to the first control. */
  initialFocus?: string;
}
export function Popover({ trigger, label, children, className, initialFocus, inline = false }: PopoverProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const { anchor, panel, position } = useFloating(open && !inline);
  useEffect(() => {
    if (!open || inline) return undefined;
    const node = panel.current;
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
      document.removeEventListener("keydown", key);
      document.removeEventListener("click", outside);
    };
  }, [open, anchor, panel, initialFocus, inline]);
  return (
    <span ref={anchor} className="ts-preview-anchor">
      {cloneElement(trigger, {
        "aria-expanded": inline || open,
        "aria-controls": id,
        "aria-haspopup": "dialog",
        onClick: (event) => {
          trigger.props.onClick?.(event);
          if (!event.defaultPrevented) setOpen(!open);
        },
      })}
      <MotionPresence>
        {(inline || open) && (
          <MotionPanel
            nativePopover={!inline}
            ref={panel}
            id={id}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            className={cx("ts-popover", className)}
            style={inline ? { position: "static" } : position}
            initial={inline ? false : "initial"}
            animate="animate"
            exit="exit"
            preset="popover"
          >
            {children}
          </MotionPanel>
        )}
      </MotionPresence>
    </span>
  );
}
