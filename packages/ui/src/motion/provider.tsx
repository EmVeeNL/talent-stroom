import { AnimatePresence, LazyMotion, MotionConfig, m } from "motion/react";
import type { ReactNode } from "react";
import { useReducedMotion } from "./reduced-motion.ts";

const loadDomAnimation = () => import("motion/react").then((module) => module.domAnimation);

export { AnimatePresence, m };
export { MotionGlobalConfig, LayoutGroup } from "motion/react";

export function MotionProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  return (
    <LazyMotion features={loadDomAnimation}>
      <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>{children}</MotionConfig>
    </LazyMotion>
  );
}
