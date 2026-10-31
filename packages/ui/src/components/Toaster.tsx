import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { FeedbackTone } from "./AlertBanner.tsx";
import { Toast } from "./Toast.tsx";
import { MotionPresence } from "../motion/presence.tsx";
import { MotionLayout } from "../motion/dom-max.tsx";
export interface ToastNotification {
  message: ReactNode;
  tone?: FeedbackTone | "error";
  title?: string;
  action?: ReactNode;
  duration?: number;
  persistent?: boolean;
  icon?: boolean;
}
interface ToastContextValue {
  toast: (notification: ToastNotification) => number;
  dismiss: (id: number) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);
export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast requires Toaster");
  return value;
}
export interface ToasterProps {
  children: ReactNode;
  label: string;
  closeLabel: string;
  maxVisible?: number;
}
export function Toaster({ children, label, closeLabel, maxVisible = 3 }: ToasterProps) {
  const [queue, setQueue] = useState<(ToastNotification & { id: number })[]>([]);
  const [expanded, setExpanded] = useState(false);
  const next = useRef(0);
  const toast = useCallback((notification: ToastNotification) => {
    const id = ++next.current;
    setQueue((previous) => [...previous, { ...notification, id }]);
    return id;
  }, []);
  const dismiss = useCallback((id: number) => setQueue((previous) => previous.filter((item) => item.id !== id)), []);
  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);
  return (
    <ToastContext value={value}>
      {children}
      <section
        aria-label={label}
        className="ts-toaster"
        data-expanded={expanded ? "true" : "false"}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onFocus={() => setExpanded(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false);
        }}
      >
        <MotionLayout>
          <MotionPresence>
            {queue.slice(0, Math.max(1, maxVisible)).map((item) => (
              <Toast
                key={item.id}
                tone={item.tone ?? "info"}
                {...(item.title ? { title: item.title } : {})}
                action={item.action}
                duration={item.duration ?? 6000}
                persistent={item.persistent ?? false}
                icon={item.icon ?? true}
                paused={expanded}
                layout
                closeLabel={closeLabel}
                onDismiss={() => dismiss(item.id)}
              >
                {item.message}
              </Toast>
            ))}
          </MotionPresence>
        </MotionLayout>
      </section>
    </ToastContext>
  );
}
