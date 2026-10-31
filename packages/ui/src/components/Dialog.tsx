import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "../classnames.ts";
import { Button } from "./Button.tsx";
import { focusable } from "./floating.ts";
export interface DialogProps {
  /** Always-visible, nonmodal gallery example without focus management. */
  inline?: boolean;
  title: string;
  triggerLabel: string;
  closeLabel: string;
  children?: ReactNode | ((close: () => void) => ReactNode);
  footer?: ReactNode | ((close: () => void) => ReactNode);
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Focus the safe alert action, detail heading, or first form field on open. */
  initialFocus?: "cancel" | "heading" | "form";
  role?: "dialog" | "alertdialog";
  /** Controlled visibility. Without it the dialog opens through its own trigger button. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hides the trigger button; use together with `open` when the caller opens the dialog. */
  hideTrigger?: boolean;
  /** Return false to keep the modal open (for example while confirming unsaved changes). */
  onBeforeClose?: () => boolean;
}
export function Dialog({
  inline = false,
  title,
  triggerLabel,
  closeLabel,
  children,
  footer,
  size = "md",
  className,
  initialFocus,
  role = "dialog",
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  onBeforeClose,
}: DialogProps) {
  const focusSelector =
    initialFocus === "cancel"
      ? "[data-cancel]"
      : initialFocus === "heading"
        ? "h2"
        : initialFocus === "form"
          ? "input:not(:disabled), textarea:not(:disabled), select:not(:disabled)"
          : focusable;
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const close = () => {
    if (inline || onBeforeClose?.() === false) return;
    dialog.current?.close();
    setOpen(false);
    onOpenChange?.(false);
    (trigger.current ?? opener.current)?.focus();
  };
  const show = () => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    onOpenChange?.(true);
    if (!dialog.current?.open) dialog.current?.showModal();
    setOpen(true);
    (dialog.current?.querySelector<HTMLElement>(focusSelector) ?? dialog.current)?.focus();
  };
  useEffect(() => {
    if (inline || controlledOpen === undefined) return undefined;
    const element = dialog.current;
    if (!element) return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (controlledOpen && !element.open) {
      opener.current = previousFocus;
      element.showModal();
      setOpen(true);
      (element.querySelector<HTMLElement>(focusSelector) ?? element).focus();
    } else if (!controlledOpen && element.open) {
      element.close();
      setOpen(false);
    }
    return () => {
      if (controlledOpen && element.open) {
        element.close();
        if (opener.current?.isConnected) opener.current.focus();
      }
    };
  }, [controlledOpen, inline, focusSelector]);
  return (
    <>
      {!inline && !hideTrigger && (
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
      )}
      <dialog
        style={inline ? { position: "static", margin: 0, width: "100%", maxHeight: "none" } : undefined}
        open={inline || undefined}
        ref={dialog}
        id={id}
        role={role}
        aria-labelledby={`${id}-title`}
        aria-modal={inline ? undefined : true}
        aria-describedby={role === "alertdialog" ? `${id}-body` : undefined}
        tabIndex={-1}
        className={cx("ts-dialog", `ts-dialog--${size}`, className)}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => {
          // A queued native close event must not dismiss a modal reopened by StrictMode.
          if (dialog.current?.open) return;
          setOpen(false);
          onOpenChange?.(false);
          trigger.current?.focus();
        }}
      >
        <header className="ts-dialog__header">
          <h2 id={`${id}-title`} tabIndex={initialFocus === "heading" ? -1 : undefined}>
            {title}
          </h2>
          {role !== "alertdialog" && <Button variant="ghost" icon="close" aria-label={closeLabel} onClick={close} />}
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
