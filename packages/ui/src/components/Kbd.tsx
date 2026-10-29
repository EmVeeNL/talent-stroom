import type { HTMLAttributes } from "react";
import { cx } from "../classnames.ts";
export type KbdProps = HTMLAttributes<HTMLElement>;
export function Kbd({ className, ...rest }: KbdProps) {
  return <kbd {...rest} className={cx("ts-kbd", className)} />;
}
