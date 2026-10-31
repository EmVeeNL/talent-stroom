import type { ReactNode } from "react";
import { Sheet } from "./Sheet.tsx";
import type { SheetProps } from "./Sheet.tsx";
import { Tabs } from "./Tabs.tsx";
import type { TabsProps } from "./Tabs.tsx";
import { Button } from "./Button.tsx";

export interface DetailDrawerProps extends SheetProps {
  tabs?: TabsProps;
  actions?: ReactNode;
  /** The caller opens its FormDialog here, retaining the drawer selection. */
  onEdit?: () => void;
  editLabel?: string;
}
export function DetailDrawer({ tabs, actions, onEdit, editLabel, footer, children, ...props }: DetailDrawerProps) {
  return (
    <Sheet
      initialFocus="heading"
      {...props}
      footer={
        footer === undefined
          ? (close) => (
              <>
                {actions}
                {onEdit && editLabel && (
                  <Button variant="outline" onClick={onEdit}>
                    {editLabel}
                  </Button>
                )}
                <Button variant="outline" onClick={close}>
                  {props.closeLabel}
                </Button>
              </>
            )
          : footer
      }
    >
      {tabs ? <Tabs {...tabs} /> : children}
    </Sheet>
  );
}
