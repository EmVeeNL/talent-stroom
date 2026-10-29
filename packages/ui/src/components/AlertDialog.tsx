import type { ReactNode } from "react";
import { Dialog } from "./Dialog.tsx";
import { Button } from "./Button.tsx";
export interface AlertDialogProps {
  title: string;
  triggerLabel: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  children?: ReactNode;
}
export function AlertDialog({ cancelLabel, confirmLabel, onConfirm, ...props }: AlertDialogProps) {
  return (
    <Dialog
      {...props}
      closeLabel={cancelLabel}
      role="alertdialog"
      initialFocus="cancel"
      size="sm"
      footer={(close) => (
        <>
          <Button data-cancel variant="secondary" onClick={close}>
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              close();
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    />
  );
}
