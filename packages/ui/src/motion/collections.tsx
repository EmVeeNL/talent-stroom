import { createContext, useContext, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useIsPresent } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { AnimatePresence, animate, m } from "./provider.tsx";
import { MotionLayout } from "./dom-max.tsx";
import { getMotionPreset } from "./presets.ts";
import { useReducedMotion } from "./reduced-motion.ts";
import { motionDurations, motionEasings } from "../tokens.ts";

const ReorderContext = createContext(true);

/** Position-only FLIP: never tween width or height, and never move under reduced motion. */
export function useMotionListItem() {
  const reduced = useReducedMotion();
  const present = useIsPresent();
  const reorder = useContext(ReorderContext);
  return {
    ...getMotionPreset("listItem", reduced),
    initial: "initial",
    animate: "animate",
    exit: "exit",
    layout: reduced || !reorder ? (false as const) : ("position" as const),
    transition: {
      ...getMotionPreset("listItem", reduced).transition,
      layout: { duration: reduced ? 0 : motionDurations.slow / 1000, ease: motionEasings.standard },
    },
    inert: !present,
    "aria-hidden": present ? undefined : (true as const),
  };
}

/** No DOM wrapper, so this is valid inside ul/ol/tbody. Keep it mounted for the empty state too. */
export function MotionCollection({ children, reorder = true }: { children: ReactNode; reorder?: boolean }) {
  const content = (
    <ReorderContext value={reorder}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </ReorderContext>
  );
  return reorder ? <MotionLayout>{content}</MotionLayout> : content;
}

export function MotionListItem(props: HTMLMotionProps<"li">) {
  const motion = useMotionListItem();
  return <m.li {...props} {...motion} />;
}

export function MotionTableRow(props: HTMLMotionProps<"tr">) {
  const motion = useMotionListItem();
  return <m.tr {...props} {...motion} />;
}

/** Enter-only feedback; never remount providers or retain a previous route's interactive content. */
export function MotionContent({ identity, children }: { identity: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const node = useRef<HTMLDivElement>(null);
  const previous = useRef(identity);
  useLayoutEffect(() => {
    const element = node.current;
    const changed = previous.current !== identity;
    previous.current = identity;
    if (!element) return undefined;
    if (reduced) {
      element.style.opacity = "1";
      element.style.removeProperty("transform");
      return undefined;
    }
    if (!changed) return undefined;
    // A keyed wrapper remounted RouterProvider during its own match publication,
    // leaving Transitioner with a state setter for a discarded Matches instance.
    const animation = animate(element, { opacity: [0, 1], y: [8, 0] }, getMotionPreset("slideUp").transition);
    return () => animation.stop();
  }, [identity, reduced]);
  return <div ref={node}>{children}</div>;
}
