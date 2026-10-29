import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";

export interface TabItem {
  id: string;
  label: string;
  panel: ReactNode;
  icon?: string;
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
        className="ts-tabs__list"
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
