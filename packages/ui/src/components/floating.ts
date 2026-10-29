import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const focusable =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';
/** Viewport-relative fallback also handles browsers without CSS anchor positioning. */
export function useFloating(open: boolean) {
  const anchor = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = () => {
      const rect = anchor.current?.getBoundingClientRect();
      const box = panel.current?.getBoundingClientRect();
      if (!rect || !box) return;
      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - box.width - 8)),
        top: Math.max(
          8,
          rect.bottom + box.height + 8 > window.innerHeight ? rect.top - box.height - 8 : rect.bottom + 8,
        ),
      });
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    if (panel.current) observer?.observe(panel.current);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);
  return { anchor, panel, position };
}
export function usePreview(delay: number) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const focused = useRef(false);
  const hovered = useRef(false);
  const clear = () => clearTimeout(timer.current);
  const schedule = () => {
    clear();
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const show = () => {
    hovered.current = true;
    schedule();
  };
  const hide = () => {
    clear();
    setOpen(false);
  };
  const leave = () => {
    hovered.current = false;
    clear();
    timer.current = setTimeout(() => {
      if (!focused.current && !hovered.current) setOpen(false);
    }, 150);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearTimeout(timer.current);
        setOpen(false);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const focus = () => {
    focused.current = true;
    schedule();
  };
  const blur = (persistOnHover = false) => {
    focused.current = false;
    if (!persistOnHover || !hovered.current) hide();
  };
  const enter = () => {
    hovered.current = true;
    clear();
  };
  return { open, show, hide, leave, clear, focus, blur, enter };
}
