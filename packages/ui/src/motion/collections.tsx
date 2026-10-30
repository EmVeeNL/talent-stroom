import { createContext, useContext, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useIsPresent } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { AnimatePresence, m } from "./provider.tsx";
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

/** Enter-only replacement: never retain a previous route or organization's interactive content. */
export function MotionContent({ identity, children }: { identity: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  return (
    <m.div
      key={identity}
      {...getMotionPreset("slideUp", reduced)}
      initial={mounted.current ? "initial" : false}
      animate="animate"
    >
      {children}
    </m.div>
  );
}
