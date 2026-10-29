import { cx } from "../classnames.ts";
import { Dialog } from "./Dialog.tsx";
import type { DialogProps } from "./Dialog.tsx";
export interface SheetProps extends DialogProps {
  side?: "left" | "right";
}
export function Sheet({ side = "right", className, ...props }: SheetProps) {
  return <Dialog {...props} className={cx("ts-sheet", `ts-sheet--${side}`, className)} />;
}
