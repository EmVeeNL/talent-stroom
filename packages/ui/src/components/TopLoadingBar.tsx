import { useEffect, useState } from "react";
import { m } from "../motion/provider.tsx";
import { useReducedMotion } from "../motion/reduced-motion.ts";
import { motionDurations, motionEasings } from "../tokens.ts";

/** Delayed indeterminate navigation feedback; callers supply localized copy. */
export function TopLoadingBar({ loading, label }: { loading: boolean; label: string }) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(loading), loading ? 150 : 400);
    return () => window.clearTimeout(timer);
  }, [loading]);
  if (!visible) return null;
  return (
    <m.div
      className="ts-top-loading-bar"
      role="progressbar"
      aria-label={label}
      data-state={loading ? "loading" : "complete"}
      data-reduced-motion={reduced || undefined}
      initial={false}
      animate={{ opacity: loading ? 1 : 0 }}
      transition={{ duration: reduced ? 0 : motionDurations.base / 1000, delay: loading || reduced ? 0 : 0.18 }}
    >
      <m.span
        initial={reduced ? false : { scaleX: 0.08 }}
        animate={{ scaleX: reduced || !loading ? 1 : 0.9 }}
        transition={{ duration: reduced ? 0 : motionDurations.fast / 1000, ease: motionEasings.standard }}
      />
    </m.div>
  );
}
