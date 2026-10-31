import { useEffect, useRef, useState } from "react";
import { Dialog } from "./Dialog.tsx";
import type { DialogProps } from "./Dialog.tsx";
import { Button } from "./Button.tsx";

export interface FormDialogLabels {
  cancel: string;
  save: string;
  discardTitle: string;
  discardBody: string;
  keepEditing: string;
  discard: string;
}
export interface FormDialogProps extends DialogProps {
  /** Bind these to TanStack Form's isDirty/isSubmitting via form.Subscribe. */
  dirty?: boolean;
  submitting?: boolean;
  /** Associates the standard footer submit button with the schema-backed form. */
  formId?: string;
  labels?: FormDialogLabels;
}

/** Presentation for schema-backed forms. Validation and values stay in the caller's form instance. */
export function FormDialog({
  dirty = false,
  submitting = false,
  formId,
  labels,
  open,
  onOpenChange,
  footer,
  children,
  initialFocus = "form",
  ...props
}: FormDialogProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const confirmationFocus = useRef<HTMLElement | null>(null);
  const visible = open ?? localOpen;
  useEffect(() => {
    if (!visible) setConfirm(false);
  }, [visible]);
  const change = (next: boolean) => {
    if (next) returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setLocalOpen(next);
    onOpenChange?.(next);
    if (!next) returnFocus.current?.focus();
  };
  const requestClose = () => {
    if (submitting || props.onBeforeClose?.() === false) return false;
    if (!dirty || !labels) return true;
    confirmationFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConfirm(true);
    return false;
  };
  return (
    <>
      <Dialog
        {...props}
        initialFocus={initialFocus}
        open={visible}
        onOpenChange={change}
        onBeforeClose={requestClose}
        footer={
          footer ??
          (formId && labels
            ? (close) => (
                <>
                  <Button variant="outline" disabled={submitting} onClick={close}>
                    {labels.cancel}
                  </Button>
                  <Button type="submit" form={formId} disabled={submitting}>
                    {labels.save}
                  </Button>
                </>
              )
            : undefined)
        }
      >
        {children}
      </Dialog>
      {labels && (
        <Dialog
          title={labels.discardTitle}
          triggerLabel={labels.discardTitle}
          closeLabel={labels.keepEditing}
          hideTrigger
          open={visible && confirm}
          role="alertdialog"
          initialFocus="cancel"
          size="sm"
          onOpenChange={(next) => {
            setConfirm(next);
            if (!next) confirmationFocus.current?.focus();
          }}
          footer={
            <>
              <Button
                data-cancel
                variant="outline"
                onClick={() => {
                  setConfirm(false);
                  confirmationFocus.current?.focus();
                }}
              >
                {labels.keepEditing}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirm(false);
                  change(false);
                }}
              >
                {labels.discard}
              </Button>
            </>
          }
        >
          <p>{labels.discardBody}</p>
        </Dialog>
      )}
    </>
  );
}
