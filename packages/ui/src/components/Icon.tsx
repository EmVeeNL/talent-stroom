import type { IconName } from "../icons.ts";
import type { HTMLAttributes } from "react";
import { cx } from "../classnames.ts";

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Material Symbols ligature name, e.g. "search" or "task_alt". */
  name: IconName;
  /** Pixel size: 16 inline, 20 default, 24 navigation, 32 illustrative. */
  size?: 16 | 20 | 24 | 32;
  filled?: boolean;
  /** Accessible name. Omit for decorative icons (hidden from assistive technology). */
  label?: string;
}

export function Icon({ name, size = 20, filled = false, label, className, ...rest }: IconProps) {
  const a11y =
    label === undefined ? ({ "aria-hidden": true } as const) : ({ role: "img", "aria-label": label } as const);
  return (
    <span
      {...rest}
      {...a11y}
      className={cx("ts-icon", "material-symbols-rounded", `ts-icon--${size}`, filled && "ts-icon--filled", className)}
    >
      {name}
    </span>
  );
}
