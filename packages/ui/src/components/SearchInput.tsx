import { useEffect, useId, useRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Icon } from "./Icon.tsx";
import { Button } from "./Button.tsx";
export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "value" | "defaultValue"
> {
  label: string;
  clearLabel: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  searchLandmark?: boolean;
}
export function SearchInput({
  label,
  clearLabel,
  value,
  defaultValue = "",
  onChange,
  onSearch,
  debounceMs = 300,
  searchLandmark = false,
  id,
  ...rest
}: SearchInputProps) {
  const uid = useId(),
    [local, setLocal] = useState(defaultValue),
    input = useRef<HTMLInputElement>(null),
    current = value ?? local;
  const callback = useRef(onSearch),
    previous = useRef(current);
  callback.current = onSearch;
  useEffect(() => {
    if (previous.current === current) return undefined;
    const timer = setTimeout(() => {
      previous.current = current;
      callback.current?.(current);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [current, debounceMs]);
  const update = (text: string) => {
    setLocal(text);
    onChange?.(text);
  };
  return (
    <div
      role={searchLandmark ? "search" : undefined}
      aria-label={searchLandmark ? label : undefined}
      className="ts-search"
    >
      <label className="ts-field__label" htmlFor={id ?? uid}>
        {label}
      </label>
      <div className="ts-search__control">
        <Icon name="search" size={20} />
        <input
          {...rest}
          id={id ?? uid}
          ref={input}
          className="ts-field__input"
          type="search"
          value={current}
          onChange={(e) => update(e.target.value)}
        />
        {current && (
          <Button
            variant="ghost"
            size="sm"
            icon="close"
            aria-label={clearLabel}
            disabled={rest.disabled}
            onClick={() => {
              update("");
              input.current?.focus();
            }}
          />
        )}
      </div>
    </div>
  );
}
