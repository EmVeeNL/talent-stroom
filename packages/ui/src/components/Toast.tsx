import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "../classnames.ts";
import { Button } from "./Button.tsx";
import { Icon } from "./Icon.tsx";
import { feedbackIcons } from "./AlertBanner.tsx";
import { MotionPanel } from "../motion/presence.tsx";
import { useReducedMotion } from "../motion/index.ts";
import type { FeedbackTone } from "./AlertBanner.tsx";
export interface ToastProps {
  children: ReactNode;
  tone?: FeedbackTone | "error";
  title?: string;
  action?: ReactNode;
  closeLabel: string;
  onDismiss: () => void;
  duration?: number;
  layout?: boolean;
  /** Never auto-closes and shows no countdown; only the close button (or Escape) dismisses it. */
  persistent?: boolean;
  /** Set false for a text-only toast. */
  icon?: boolean;
  /** Parent-controlled hold, e.g. while a whole stack is hovered. */
  paused?: boolean;
}
export function Toast({
  children,
  tone = "info",
  title,
  action,
  closeLabel,
  onDismiss,
  duration = 6000,
  layout,
  persistent = false,
  icon = true,
  paused = false,
}: ToastProps) {
  const reduced = useReducedMotion();
  const feedbackTone = tone === "error" ? "danger" : tone;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const timed = !persistent && duration > 0;
  const hold = hovered || focused || paused;
  const remaining = useRef(duration);
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  }, [onDismiss]);
  useEffect(() => {
    if (hold || !timed) return undefined;
    const started = Date.now();
    const timer = setTimeout(() => dismiss.current(), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [hold, timed, duration]);
  return (
    <MotionPanel
      className={cx("ts-toast", `ts-toast--${feedbackTone}`)}
      {...(layout && !reduced ? { layout: true } : {})}
      initial="initial"
      animate="animate"
      exit="exit"
      preset="toast"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-persistent={timed ? "false" : "true"}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.stopPropagation();
        onDismiss();
      }}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div role={feedbackTone === "danger" ? "alert" : "status"} aria-atomic="true" className="ts-toast__message">
        {icon && <Icon name={feedbackIcons[feedbackTone]} />}
        <div className="ts-toast__content">
          {title && <strong>{title}</strong>}
          <div>{children}</div>
        </div>
      </div>
      {action && <div className="ts-toast__action">{action}</div>}
      <Button variant="ghost" icon="close" aria-label={closeLabel} onClick={onDismiss} />
      {timed && (
        <span
          aria-hidden="true"
          className="ts-toast__countdown"
          data-paused={hold ? "true" : "false"}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </MotionPanel>
  );
}
