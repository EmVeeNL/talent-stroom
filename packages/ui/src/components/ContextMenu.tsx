import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { IconName } from "../icons.ts";
import { Icon } from "./Icon.tsx";
import { Button } from "./Button.tsx";
import { useFloating } from "./floating.ts";
import { MotionPanel, MotionPresence } from "../motion/presence.tsx";

export type ContextMenuItem = { id: string } & (
  | { separator: true }
  | {
      separator?: false;
      label: string;
      icon?: IconName;
      disabled?: boolean;
      tone?: "danger";
      /** Danger callbacks must request confirmation before mutating data. */ onSelect: () => void;
    }
);
export interface ContextMenuProps {
  triggerLabel: string;
  items: readonly ContextMenuItem[];
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  disabled?: boolean;
}
/** Menu-button pattern for caller-authorized card and table-row actions. */
export function ContextMenu({
  triggerLabel,
  items,
  onOpenChange,
  defaultOpen = false,
  disabled = false,
}: ContextMenuProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const trigger = useRef<HTMLButtonElement>(null);
  const initial = useRef<"first" | "last">("first");
  const search = useRef({ text: "", time: 0 });
  // An initially open menu (e.g. a gallery example) must anchor within the viewport
  // before measuring its floating panel or moving keyboard focus into it.
  useLayoutEffect(() => {
    if (open) trigger.current?.scrollIntoView?.({ block: "nearest" });
  }, [open]);
  const { anchor, panel, position } = useFloating(open);
  const change = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };
  const close = () => {
    change(false);
    trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return undefined;
    const node = panel.current;
    const buttons = node?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
    buttons?.[initial.current === "last" ? buttons.length - 1 : 0]?.focus();
    search.current = { text: "", time: 0 };
    const outside = (event: MouseEvent) => {
      if (event.target instanceof Node && !anchor.current?.contains(event.target)) {
        setOpen(false);
        onOpenChange?.(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("click", outside);
    return () => {
      document.removeEventListener("click", outside);
    };
  }, [open, panel, anchor, onOpenChange]);
  return (
    <span ref={anchor} className="ts-context-menu-anchor">
      <Button
        ref={trigger}
        variant="outline"
        size="sm"
        disabled={disabled}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          initial.current = "first";
          change(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            initial.current = event.key === "ArrowUp" ? "last" : "first";
            change(true);
          }
        }}
      >
        <Icon name="more_horiz" size={16} />
      </Button>
      <MotionPresence>
        {open && (
          <MotionPanel
            nativePopover
            ref={panel}
            id={id}
            role="menu"
            aria-label={triggerLabel}
            className="ts-context-menu"
            style={position}
            initial="initial"
            animate="animate"
            exit="exit"
            preset="popover"
            onKeyDown={(event) => {
              const buttons = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
              const index = buttons.findIndex((button) => button === document.activeElement);
              let next: number | undefined;
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                close();
                return;
              }
              if (event.key === "Tab") {
                close();
                return;
              }
              if (event.key === "ArrowDown") next = (index + 1) % buttons.length;
              if (event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
              if (event.key === "Home") next = 0;
              if (event.key === "End") next = buttons.length - 1;
              if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.altKey && !event.metaKey) {
                const now = Date.now();
                const previous = now - search.current.time < 500 ? search.current.text : "";
                const text = previous + event.key.toLocaleLowerCase();
                search.current = { text, time: now };
                const query = Array.from(text).every((letter) => letter === text[0]) ? (text[0] ?? text) : text;
                next = buttons.findIndex((_, offset) =>
                  buttons[(index + offset + 1) % buttons.length]?.dataset["label"]
                    ?.toLocaleLowerCase()
                    .startsWith(query),
                );
                next = next < 0 ? undefined : (index + next + 1) % buttons.length;
              }
              if (next !== undefined) {
                event.preventDefault();
                buttons[next]?.focus();
              }
            }}
          >
            {items.map((item) =>
              item.separator ? (
                <div key={item.id} role="separator" className="ts-context-menu__separator" />
              ) : (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  aria-disabled={item.disabled || undefined}
                  data-label={item.label}
                  data-tone={item.tone}
                  onClick={() => {
                    if (!item.disabled) {
                      close();
                      item.onSelect();
                    }
                  }}
                >
                  {item.icon && <Icon name={item.icon} size={16} />}
                  {item.label}
                </button>
              ),
            )}
          </MotionPanel>
        )}
      </MotionPresence>
    </span>
  );
}
