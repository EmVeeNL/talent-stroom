import { useEffect, useId, useState } from "react";
import { applyThemePreference, getThemePreference, isThemePreference, setThemePreference } from "../theme.ts";
import type { ThemePreference } from "../theme.ts";
import { cx } from "../classnames.ts";
export interface ThemeToggleProps {
  label: string;
  labels: Record<ThemePreference, string>;
  className?: string;
}
export function ThemeToggle({ label, labels, className }: ThemeToggleProps) {
  const name = useId();
  const [value, setValue] = useState(getThemePreference);
  useEffect(() => {
    const update = (event: Event) => {
      const detail: unknown = event instanceof CustomEvent ? event.detail : undefined;
      const preference = isThemePreference(detail) ? detail : getThemePreference();
      applyThemePreference(preference);
      setValue(preference);
    };
    window.addEventListener("storage", update);
    window.addEventListener("ts-theme-change", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("ts-theme-change", update);
    };
  }, []);
  return (
    <fieldset className={cx("ts-theme-toggle", className)}>
      <legend>{label}</legend>
      {(["system", "light", "dark"] as const).map((theme) => (
        <label key={theme}>
          <input
            type="radio"
            name={name}
            value={theme}
            checked={value === theme}
            onChange={() => {
              setThemePreference(theme);
              setValue(theme);
            }}
          />
          {labels[theme]}
        </label>
      ))}
    </fieldset>
  );
}
