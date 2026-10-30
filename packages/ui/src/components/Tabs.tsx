import type { IconName } from "../icons.ts";
import { useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
import { m, useReducedMotion } from "../motion/index.ts";
import { motionDurations, motionEasings } from "../tokens.ts";

export interface TabItem {
  id: string;
  label: ReactNode;
  panel: ReactNode;
  icon?: IconName;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: readonly TabItem[];
  /** Accessible name of the tab list. */
  label: string;
  /** Controlled selection. */
  selectedId?: string;
  defaultSelectedId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

/** WAI-ARIA tabs pattern (automatic activation): roving tabindex, Left/Right/Home/End. */
export function Tabs({ tabs, label, selectedId, defaultSelectedId, onChange, className }: TabsProps) {
  const baseId = useId();
  const firstEnabled = tabs.find((tab) => !tab.disabled)?.id;
  const [internalId, setInternalId] = useState(defaultSelectedId ?? firstEnabled);
  const currentId = selectedId ?? internalId;
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const list = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; width: number }>();
  const reducedMotion = useReducedMotion();
  useLayoutEffect(() => {
    const parent = list.current;
    if (!parent) return undefined;
    const measure = () => {
      const button = buttons.current.get(currentId ?? "");
      if (!button) {
        setIndicator(undefined);
        return;
      }
      const rect = button.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      setIndicator({ x: rect.left - parentRect.left + parent.scrollLeft, width: rect.width });
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    observer?.observe(parent);
    for (const button of buttons.current.values()) observer?.observe(button);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [currentId, tabs]);

  const select = (id: string) => {
    if (selectedId === undefined) setInternalId(id);
    onChange?.(id);
    buttons.current.get(id)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = tabs.filter((tab) => !tab.disabled);
    if (enabled.length === 0) return;
    const index = enabled.findIndex((tab) => tab.id === currentId);
    let next: TabItem | undefined;
    switch (event.key) {
      case "ArrowRight":
        next = enabled[(index + 1) % enabled.length];
        break;
      case "ArrowLeft":
        next = enabled[(index - 1 + enabled.length) % enabled.length];
        break;
      case "Home":
        next = enabled[0];
        break;
      case "End":
        next = enabled.at(-1);
        break;
      default:
        return;
    }
    event.preventDefault();
    if (next) select(next.id);
  };

  return (
    <div className={cx("ts-tabs", className)}>
      <div
        ref={list}
        className={cx("ts-tabs__list", indicator && "ts-tabs__list--measured")}
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab) => {
          const selected = tab.id === currentId;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) buttons.current.set(tab.id, node);
                else buttons.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-controls={`${baseId}-panel-${tab.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              className={cx("ts-tabs__tab", selected && "ts-tabs__tab--selected")}
              onClick={() => select(tab.id)}
            >
              {tab.icon ? <Icon name={tab.icon} size={20} /> : null}
              {tab.label}
            </button>
          );
        })}
        {indicator && (
          <m.span
            aria-hidden="true"
            className="ts-tabs__indicator"
            initial={false}
            style={{ width: 1, originX: 0 }}
            animate={{ x: indicator.x, scaleX: indicator.width }}
            transition={{ duration: reducedMotion ? 0 : motionDurations.base / 1000, ease: motionEasings.standard }}
          />
        )}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== currentId}
          tabIndex={0}
          className="ts-tabs__panel"
        >
          {tab.id === currentId ? tab.panel : null}
        </div>
      ))}
    </div>
  );
}
