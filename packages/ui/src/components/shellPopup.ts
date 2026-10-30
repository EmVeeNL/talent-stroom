import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

/** Open state for a shell popup anchored to a trigger: Escape and outside clicks close it, focus returns to the trigger. */
export function useShellPopup(defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    const outside = (event: MouseEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) close(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("mousedown", outside);
    };
  }, [open, close]);
  return { open, setOpen, close, root, trigger };
}

const ITEM = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

/** Focus a menu item by position; disabled items stay focusable (WAI-ARIA menu pattern). */
export function focusMenuItem(menu: HTMLElement | null, which: "first" | "last" | "next" | "previous") {
  const items = [...(menu?.querySelectorAll<HTMLElement>(ITEM) ?? [])];
  if (!items.length) return;
  const current = items.findIndex((item) => item === document.activeElement);
  const index =
    which === "first"
      ? 0
      : which === "last"
        ? items.length - 1
        : (current + (which === "next" ? 1 : -1) + items.length) % items.length;
  items[index]?.focus();
}

/** Arrow keys, Home/End and Tab handling for a `role="menu"` element. */
export function menuKeyDown(event: ReactKeyboardEvent<HTMLElement>, close: (restoreFocus?: boolean) => void) {
  const moves: Record<string, "first" | "last" | "next" | "previous"> = {
    ArrowDown: "next",
    ArrowUp: "previous",
    Home: "first",
    End: "last",
  };
  const move = moves[event.key];
  if (move) {
    event.preventDefault();
    focusMenuItem(event.currentTarget, move);
  } else if (event.key === "Tab") close(false);
}

/** Initials for an avatar fallback (decorative; the name is always visible or labelled elsewhere). */
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("nl-NL");
}
