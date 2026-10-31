import { AnimatePresence, m, useIsPresent } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { useImperativeHandle, useLayoutEffect, useRef } from "react";
import type { ReactNode, Ref } from "react";
import { getMotionPreset } from "./presets.ts";
import type { MotionPresetName } from "./presets.ts";
import { useReducedMotion } from "./reduced-motion.ts";

/** Reduced motion removes closed surfaces in the same render, without a presence frame. */
export function MotionPresence({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  // initial={false} leaks through PresenceContext to nested animations (e.g. Card children),
  // suppressing even keyed replays for the lifetime of the presence child.
  return reduced ? children : <AnimatePresence>{children}</AnimatePresence>;
}

interface MotionPanelProps extends HTMLMotionProps<"div"> {
  ref?: Ref<HTMLDivElement>;
  preset?: MotionPresetName;
  nativePopover?: boolean;
}

/** Visual exits never retain keyboard or accessibility-tree access to closed content. */
export function MotionPanel({ ref, preset = "popover", nativePopover = false, ...props }: MotionPanelProps) {
  const node = useRef<HTMLDivElement>(null);
  const present = useIsPresent();
  const reduced = useReducedMotion();
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => node.current, []);
  useLayoutEffect(() => {
    const element = node.current;
    if (!nativePopover || !element?.showPopover) return undefined;
    element.showPopover();
    // A manual native popover keeps the top layer through its exit. The caller
    // handles Escape/light dismiss immediately; removal ends the native lifetime.
    return () => {
      if (element.isConnected) element.hidePopover?.();
    };
  }, [nativePopover]);
  const motion = getMotionPreset(preset, reduced);
  return (
    <m.div
      initial="initial"
      animate="animate"
      exit="exit"
      {...props}
      ref={node}
      popover={
        nativePopover && typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype
          ? "manual"
          : undefined
      }
      inert={!present || undefined}
      aria-hidden={!present || undefined}
      variants={motion.variants}
      transition={motion.transition}
    />
  );
}
