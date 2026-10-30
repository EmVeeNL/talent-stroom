import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

/** Load layout/drag features only from routes that need them (Kanban and reorderable lists). */
export const loadDomMax = () => import("motion/react").then((module) => module.domMax);

export function MotionLayout({ children }: { children: ReactNode }) {
  return <LazyMotion features={loadDomMax}>{children}</LazyMotion>;
}
