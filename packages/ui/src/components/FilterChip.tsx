import type { MouseEventHandler, ReactNode } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
import { getMotionPreset, m, useReducedMotion, useIsPresent } from "../motion/index.ts";

interface SharedProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export interface ToggleFilterChipProps extends SharedProps {
  kind: "toggle";
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  onClick?: never;
}

export interface RemovableFilterChipProps extends SharedProps {
  kind: "removable";
  removeLabel: string;
  onRemove: () => void;
  onClick?: never;
}

export interface ActionFilterChipProps extends SharedProps {
  kind: "dropdown" | "add";
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export type FilterChipProps = ToggleFilterChipProps | RemovableFilterChipProps | ActionFilterChipProps;

export function FilterChip(props: FilterChipProps) {
  const present = useIsPresent();
  const reduced = useReducedMotion();
  const preset = getMotionPreset("listItem", reduced);
  const { kind, className, children } = props;
  if (kind === "removable") {
    return (
      <m.span
        inert={!present}
        aria-hidden={!present || undefined}
        variants={preset.variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={preset.transition}
        className={cx("ts-filter-chip", "ts-filter-chip--removable", className)}
      >
        <span className="ts-filter-chip__label">{children}</span>
        <button
          type="button"
          className="ts-filter-chip__remove"
          aria-label={props.removeLabel}
          disabled={props.disabled}
          onClick={props.onRemove}
        >
          <Icon name="close" size={16} />
        </button>
      </m.span>
    );
  }

  return (
    <m.button
      inert={!present}
      aria-hidden={!present || undefined}
      variants={preset.variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={preset.transition}
      type="button"
      {...(kind === "toggle"
        ? { "aria-pressed": props.pressed, onClick: () => props.onPressedChange(!props.pressed) }
        : { onClick: props.onClick })}
      className={cx(
        "ts-filter-chip",
        `ts-filter-chip--${kind}`,
        kind === "toggle" && props.pressed && "is-selected",
        className,
      )}
      disabled={props.disabled}
    >
      {kind === "add" && <Icon name="add" size={16} />}
      <span>{children}</span>
      {kind === "dropdown" && <Icon name="expand_more" size={16} />}
    </m.button>
  );
}
