import { useRef } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
export interface ViewOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}
export interface ViewSwitcherProps {
  label: string;
  options: ViewOption[];
  value: string;
  onChange: (value: string) => void;
}
export function ViewSwitcher({ label, options, value, onChange }: ViewSwitcherProps) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const available = options.filter((o) => !o.disabled);
  return (
    <div role="radiogroup" aria-label={label} className="ts-view-switcher">
      {options.map((o) => (
        <button
          key={o.value}
          ref={(node) => {
            if (node) refs.current.set(o.value, node);
            else refs.current.delete(o.value);
          }}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          tabIndex={
            value === o.value || (!available.some((a) => a.value === value) && available[0]?.value === o.value) ? 0 : -1
          }
          className={cx("ts-view-switcher__option", value === o.value && "ts-view-switcher__option--selected")}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            const index = available.findIndex((a) => a.value === o.value);
            let next = index;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % available.length;
            else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
              next = (index - 1 + available.length) % available.length;
            else if (e.key === "Home") next = 0;
            else if (e.key === "End") next = available.length - 1;
            else return;
            e.preventDefault();
            const item = available[next];
            if (item) {
              onChange(item.value);
              refs.current.get(item.value)?.focus();
            }
          }}
        >
          {o.icon && <Icon name={o.icon} size={20} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
