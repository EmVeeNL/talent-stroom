import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "./Badge.tsx";
import { Button } from "./Button.tsx";
import { Icon } from "./Icon.tsx";
import { cx } from "../classnames.ts";
export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface ComboboxProps {
  label: string;
  options: ComboboxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  emptyLabel: string;
  removeLabel: (label: string) => string;
  disabled?: boolean;
}
export function Combobox({
  label,
  options,
  value,
  onChange,
  multiple = false,
  emptyLabel,
  removeLabel,
  disabled,
}: ComboboxProps) {
  const id = useId(),
    input = useRef<HTMLInputElement>(null),
    [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  const filtered = options.filter((o) => o.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const enabled = filtered.filter((o) => !o.disabled);
  const item = enabled[Math.min(active, enabled.length - 1)];
  useEffect(() => {
    if (open && item)
      document.getElementById(`${id}-${encodeURIComponent(item.value)}`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, item, id]);
  const select = (option: ComboboxOption) => {
    onChange(
      multiple
        ? value.includes(option.value)
          ? value.filter((v) => v !== option.value)
          : [...value, option.value]
        : [option.value],
    );
    setQuery("");
    if (!multiple) setOpen(false);
    input.current?.focus();
  };
  const selected = options.filter((o) => value.includes(o.value));
  return (
    <div
      className="ts-combobox"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setOpen(false);
          setQuery("");
        }
      }}
    >
      <label className="ts-field__label" htmlFor={id}>
        {label}
      </label>
      {multiple && selected.length > 0 && (
        <div className="ts-combobox__chips">
          {selected.map((o) => (
            <Badge key={o.value}>
              {o.label}
              <Button
                variant="ghost"
                size="sm"
                icon="close"
                disabled={disabled}
                aria-label={removeLabel(o.label)}
                onClick={() => {
                  onChange(value.filter((v) => v !== o.value));
                  input.current?.focus();
                }}
              />
            </Badge>
          ))}
        </div>
      )}
      <div className="ts-combobox__input">
        <input
          id={id}
          ref={input}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? `${id}-list` : undefined}
          aria-activedescendant={open && item ? `${id}-${encodeURIComponent(item.value)}` : undefined}
          disabled={disabled}
          className="ts-field__input"
          value={open ? query : multiple ? "" : (selected[0]?.label ?? "")}
          onClick={() => {
            setOpen(true);
            setActive(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive(
                open
                  ? (active + (e.key === "ArrowDown" ? 1 : -1) + enabled.length) % Math.max(1, enabled.length)
                  : e.key === "ArrowDown"
                    ? 0
                    : enabled.length - 1,
              );
            } else if (open && (e.key === "Home" || e.key === "End")) {
              e.preventDefault();
              setActive(e.key === "Home" ? 0 : enabled.length - 1);
            } else if (open && e.key === "Enter") {
              e.preventDefault();
              if (item) select(item);
            } else if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              setQuery("");
            } else if (e.key === "Tab") {
              setOpen(false);
              setQuery("");
            }
          }}
        />
        <Icon name="expand_more" size={20} />
      </div>
      {open && (
        <div className="ts-combobox__popup">
          <ul id={`${id}-list`} role="listbox" aria-label={label} aria-multiselectable={multiple || undefined}>
            {filtered.map((o) => (
              <li
                id={`${id}-${encodeURIComponent(o.value)}`}
                key={o.value}
                role="option"
                aria-selected={value.includes(o.value)}
                aria-disabled={o.disabled || undefined}
                className={cx("ts-combobox__option", item?.value === o.value && "ts-combobox__option--active")}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!o.disabled) select(o);
                }}
              >
                <span>{o.label}</span>
                {value.includes(o.value) && <Icon name="check" size={20} />}
              </li>
            ))}
          </ul>
          {filtered.length === 0 && <p role="status">{emptyLabel}</p>}
        </div>
      )}
    </div>
  );
}
