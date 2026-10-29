import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { FeedbackTone } from "./AlertBanner.tsx";
import { Toast } from "./Toast.tsx";
export interface ToastNotification {
  message: ReactNode;
  tone?: FeedbackTone;
  duration?: number;
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
      <section aria-label={label} className="ts-toaster">
        {queue.slice(0, Math.max(1, maxVisible)).map((item) => (
          <Toast
            key={item.id}
            tone={item.tone ?? "info"}
            duration={item.duration ?? 6000}
            closeLabel={closeLabel}
            onDismiss={() => dismiss(item.id)}
          >
            {item.message}
          </Toast>
        ))}
      </section>
    </ToastContext>
  );
}
