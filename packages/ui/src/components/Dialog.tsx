import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "../classnames.ts";
import { Button } from "./Button.tsx";
import { focusable } from "./floating.ts";
export interface DialogProps {
  title: string;
  triggerLabel: string;
  closeLabel: string;
  children?: ReactNode | ((close: () => void) => ReactNode);
  footer?: ReactNode | ((close: () => void) => ReactNode);
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Used by AlertDialog to focus the least destructive action. */
  initialFocus?: "cancel";
  role?: "dialog" | "alertdialog";
}
export function Dialog({
  title,
  triggerLabel,
  closeLabel,
  children,
  footer,
  size = "md",
  className,
  initialFocus,
  role = "dialog",
}: DialogProps) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  };
  const show = () => {
    dialog.current?.showModal();
    setOpen(true);
    (
      dialog.current?.querySelector<HTMLElement>(initialFocus === "cancel" ? "[data-cancel]" : focusable) ??
      dialog.current
    )?.focus();
  };
  return (
    <>
      <Button
        ref={trigger}
        variant="secondary"
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={open}
        onClick={show}
      >
        {triggerLabel}
      </Button>
      <dialog
        ref={dialog}
        id={id}
        role={role}
        aria-labelledby={`${id}-title`}
        aria-modal="true"
        aria-describedby={role === "alertdialog" ? `${id}-body` : undefined}
        tabIndex={-1}
        className={cx("ts-dialog", `ts-dialog--${size}`, className)}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus();
        }}
      >
        <header className="ts-dialog__header">
          <h2 id={`${id}-title`}>{title}</h2>
          {role !== "alertdialog" && (
            <Button variant="ghost" onClick={close}>
              {closeLabel}
            </Button>
          )}
        </header>
        <div id={`${id}-body`} className="ts-dialog__body">
          {typeof children === "function" ? children(close) : children}
        </div>
        {footer && (
          <footer className="ts-dialog__footer">{typeof footer === "function" ? footer(close) : footer}</footer>
        )}
      </dialog>
    </>
  );
}
