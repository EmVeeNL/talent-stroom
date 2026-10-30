import type { IconName } from "../icons.ts";
import { useEffect, useId, useState } from "react";
import type { ButtonHTMLAttributes, Ref } from "react";
import { cx } from "../classnames.ts";
import { applyThemePreference, getThemePreference, isThemePreference, setThemePreference } from "../theme.ts";
import { Icon } from "./Icon.tsx";
import { focusMenuItem, menuKeyDown, useShellPopup } from "./shellPopup.ts";

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export interface NavbarSearchProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  /** Visible placeholder, also the accessible name ("Zoek kandidaten, vacatures…"). */
  placeholder: string;
}
/** Search field look-alike that opens the CommandPalette (pass it through `renderTrigger`). */
export function NavbarSearch({ placeholder, className, ...rest }: NavbarSearchProps) {
  const [mac, setMac] = useState(false);
  useEffect(() => setMac(isMac()), []);
  return (
    <button {...rest} type="button" className={cx("ts-navbar-search", className)}>
      <Icon name="search" size={20} />
      <span className="ts-navbar-search__placeholder">{placeholder}</span>
      <kbd className="ts-navbar-search__kbd" aria-hidden="true">
        {mac ? "⌘" : "Ctrl"} K
      </kbd>
    </button>
  );
}

export interface NavbarIconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  ref?: Ref<HTMLButtonElement>;
  icon: IconName;
  /** Accessible name (icon-only button). */
  label: string;
  /** Unread dot; announce it in `label`, e.g. "Meldingen, 2 ongelezen". */
  dot?: boolean;
  filled?: boolean;
}
export function NavbarIconButton({ icon, label, dot = false, filled, className, ...rest }: NavbarIconButtonProps) {
  return (
    <button {...rest} type="button" aria-label={label} className={cx("ts-navbar-button", className)}>
      <Icon name={icon} size={24} filled={filled ?? false} />
      {dot ? <span className="ts-navbar-button__dot" aria-hidden="true" /> : null}
    </button>
  );
}

function prefersDark() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches
    : false;
}
function resolvedDark() {
  if (typeof document === "undefined") return false;
  const forced = document.documentElement.dataset["theme"];
  if (forced === "dark" || forced === "light") return forced === "dark";
  const preference = getThemePreference();
  return preference === "system" ? prefersDark() : preference === "dark";
}
/** Current light/dark appearance, following `ts-theme-change`, storage and OS changes. */
export function useDarkMode(): [boolean, (dark: boolean) => void] {
  const [dark, setDark] = useState(resolvedDark);
  useEffect(() => {
    const update = (event: Event) => {
      const detail: unknown = event instanceof CustomEvent ? event.detail : undefined;
      if (event.type === "storage") applyThemePreference(getThemePreference());
      else if (isThemePreference(detail)) applyThemePreference(detail);
      setDark(resolvedDark());
    };
    const media = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    // Other code (ThemeToggle, the gallery's forced theme) may set data-theme directly.
    const observer =
      typeof MutationObserver === "undefined" ? undefined : new MutationObserver(() => setDark(resolvedDark()));
    observer?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    setDark(resolvedDark());
    window.addEventListener("storage", update);
    window.addEventListener("ts-theme-change", update);
    media?.addEventListener?.("change", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("storage", update);
      window.removeEventListener("ts-theme-change", update);
      media?.removeEventListener?.("change", update);
    };
  }, []);
  return [
    dark,
    (next: boolean) => {
      setThemePreference(next ? "dark" : "light");
      setDark(next);
    },
  ];
}

export interface ThemeButtonProps {
  /** Accessible name, e.g. "Donkere modus"; the pressed state tells whether it is on. */
  label: string;
}
/** Navbar dark-mode toggle (`dark_mode`), a toggle button synchronised with ThemeToggle and the user menu. */
export function ThemeButton({ label }: ThemeButtonProps) {
  const [dark, setDark] = useDarkMode();
  return (
    <NavbarIconButton
      icon="dark_mode"
      filled={dark}
      label={label}
      aria-pressed={dark}
      className="ts-navbar-button--theme"
      onClick={() => setDark(!dark)}
    />
  );
}

export interface LanguageOption {
  value: string;
  /** Full name in its own language, e.g. "Nederlands". */
  label: string;
  /** Short code shown in the navbar, e.g. "NL". */
  short: string;
}
export interface LanguageMenuProps {
  /** Accessible name prefix, e.g. "Taal". */
  label: string;
  value: string;
  options: readonly LanguageOption[];
  onChange: (value: string) => void;
}
/** Language menu button (flag + code) with `menuitemradio` choices. */
export function LanguageMenu({ label, value, options, onChange }: LanguageMenuProps) {
  const id = useId();
  const popup = useShellPopup();
  const current = options.find((option) => option.value === value) ?? options[0];
  useEffect(() => {
    if (popup.open) focusMenuItem(document.getElementById(id), "first");
  }, [popup.open, id]);
  return (
    <div ref={popup.root} className="ts-shell-anchor">
      <button
        ref={popup.trigger}
        type="button"
        className="ts-navbar-language"
        aria-haspopup="menu"
        aria-expanded={popup.open}
        aria-controls={popup.open ? id : undefined}
        aria-label={`${label}: ${current?.label ?? ""}`}
        onClick={() => popup.setOpen(!popup.open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            popup.setOpen(true);
          }
        }}
      >
        <span className={cx("ts-flag", `ts-flag--${current?.short.toLowerCase() ?? "nl"}`)} aria-hidden="true" />
        <span aria-hidden="true">{current?.short}</span>
      </button>
      {popup.open ? (
        <div
          id={id}
          role="menu"
          aria-label={label}
          className="ts-shell-popup ts-shell-menu ts-shell-popup--compact"
          onKeyDown={(event) => menuKeyDown(event, popup.close)}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={option.value === value}
              tabIndex={-1}
              className="ts-shell-menu__item"
              onClick={() => {
                onChange(option.value);
                popup.close();
              }}
            >
              <span className={cx("ts-flag", `ts-flag--${option.short.toLowerCase()}`)} aria-hidden="true" />
              <span className="ts-shell-menu__label">{option.label}</span>
              {option.value === value ? <Icon name="check" size={20} className="ts-shell-menu__check" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
