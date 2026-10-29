import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cx } from "../classnames.ts";
import { Button } from "./Button.tsx";
import { Icon } from "./Icon.tsx";
import { feedbackIcons } from "./AlertBanner.tsx";
import type { FeedbackTone } from "./AlertBanner.tsx";
export interface ToastProps {
  children: ReactNode;
  tone?: FeedbackTone;
  closeLabel: string;
  onDismiss: () => void;
  duration?: number;
}
export function Toast({ children, tone = "info", closeLabel, onDismiss, duration = 6000 }: ToastProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(duration);
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  }, [onDismiss]);
  useEffect(() => {
    if (hovered || focused || duration <= 0) return undefined;
    const started = Date.now();
    const timer = setTimeout(() => dismiss.current(), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [hovered, focused, duration]);
  return (
    <div
      className={cx("ts-toast", `ts-toast--${tone}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div role={tone === "danger" ? "alert" : "status"} aria-atomic="true" className="ts-toast__message">
        <Icon name={feedbackIcons[tone]} />
        {children}
      </div>
      <Button variant="ghost" onClick={onDismiss}>
        {closeLabel}
      </Button>
    </div>
  );
}
