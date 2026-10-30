import type { IconName } from "../icons.ts";
import { useEffect, useId } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
import { useDarkMode } from "./Navbar.tsx";
import { focusMenuItem, initials, menuKeyDown, useShellPopup } from "./shellPopup.ts";

export interface UserMenuLabels {
  /** Menu button accessible name prefix, e.g. "Gebruikersmenu". */
  menu: string;
  profile: string;
  settings: string;
  darkMode: string;
  language: string;
  shortcuts: string;
  help: string;
  signOut: string;
  /** Marker for entries without a destination yet ("Binnenkort"). */
  soon: string;
}
export interface UserMenuProps {
  name: string;
  email?: string;
  /** Second line in the trigger (active organization). */
  organization?: string;
  avatarSrc?: string;
  labels: UserMenuLabels;
  /** Current language name, e.g. "Nederlands"; activating "Taal" calls `onLanguageChange`. */
  languageName: string;
  onLanguageChange?: () => void;
  onSignOut: () => void;
  signOutBusy?: boolean;
  onProfile?: () => void;
  onSettings?: () => void;
  onShortcuts?: () => void;
  onHelp?: () => void;
  /** Show only the avatar in the trigger (mobile). */
  compact?: boolean;
  defaultOpen?: boolean;
}

function Avatar({ name, src }: { name: string; src: string | undefined }) {
  return src ? (
    <img className="ts-user-avatar" src={src} alt="" />
  ) : (
    <span className="ts-user-avatar" aria-hidden="true">
      {initials(name)}
    </span>
  );
}

/** User button with the WAI-ARIA menu button pattern (section 09 of the foundation concept). */
export function UserMenu({
  name,
  email,
  organization,
  avatarSrc,
  labels,
  languageName,
  onLanguageChange,
  onSignOut,
  signOutBusy = false,
  onProfile,
  onSettings,
  onShortcuts,
  onHelp,
  compact = false,
  defaultOpen = false,
}: UserMenuProps) {
  const id = useId();
  const popup = useShellPopup(defaultOpen);
  const [dark, setDark] = useDarkMode();
  const { open } = popup;
  useEffect(() => {
    if (open && !defaultOpen) focusMenuItem(document.getElementById(`${id}-menu`), "first");
  }, [open, id, defaultOpen]);
  const item = (key: string, icon: IconName, label: string, action: (() => void) | undefined, className?: string) => (
    <button
      key={key}
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={action ? undefined : true}
      className={cx("ts-shell-menu__item", className)}
      onClick={() => {
        if (!action) return;
        popup.close();
        action();
      }}
    >
      <Icon name={icon} size={20} />
      <span className="ts-shell-menu__label">{label}</span>
      {action ? null : <span className="ts-shell-menu__soon">{labels.soon}</span>}
    </button>
  );
  return (
    <div ref={popup.root} className="ts-shell-anchor">
      <button
        ref={popup.trigger}
        type="button"
        className={cx("ts-user-trigger", compact && "ts-user-trigger--compact")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        aria-label={`${labels.menu}: ${name}${organization ? `, ${organization}` : ""}`}
        onClick={() => popup.setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            popup.setOpen(true);
            if (event.key === "ArrowUp")
              requestAnimationFrame(() => focusMenuItem(document.getElementById(`${id}-menu`), "last"));
          }
        }}
      >
        <Avatar name={name} src={avatarSrc} />
        <span className="ts-user-trigger__text" aria-hidden="true">
          <span className="ts-user-trigger__name">{name}</span>
          {organization ? <span className="ts-user-trigger__org">{organization}</span> : null}
        </span>
        <Icon name="expand_more" size={20} className="ts-user-trigger__chevron" />
      </button>
      {open ? (
        <div className="ts-shell-popup ts-user-menu">
          <div className="ts-user-menu__identity">
            <Avatar name={name} src={avatarSrc} />
            <span className="ts-user-menu__who">
              <span className="ts-user-menu__name">{name}</span>
              {email ? <span className="ts-user-menu__email">{email}</span> : null}
            </span>
          </div>
          <div
            id={`${id}-menu`}
            role="menu"
            aria-label={labels.menu}
            className="ts-shell-menu"
            onKeyDown={(event) => menuKeyDown(event, popup.close)}
          >
            {item("profile", "person", labels.profile, onProfile)}
            {item("settings", "settings", labels.settings, onSettings)}
            <div role="separator" className="ts-shell-menu__separator" />
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={dark}
              tabIndex={-1}
              className="ts-shell-menu__item"
              onClick={() => setDark(!dark)}
            >
              <Icon name="dark_mode" size={20} />
              <span className="ts-shell-menu__label">{labels.darkMode}</span>
              <span className="ts-shell-menu__switch" aria-hidden="true">
                <span />
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={onLanguageChange ? undefined : true}
              className="ts-shell-menu__item"
              onClick={() => onLanguageChange?.()}
            >
              <Icon name="language" size={20} />
              <span className="ts-shell-menu__label">{labels.language}</span>
              <span className="ts-shell-menu__value">{languageName}</span>
              <Icon name="unfold_more" size={16} className="ts-shell-menu__value-icon" />
            </button>
            <div role="separator" className="ts-shell-menu__separator" />
            {item("shortcuts", "keyboard", labels.shortcuts, onShortcuts)}
            {item("help", "help", labels.help, onHelp)}
            <div role="separator" className="ts-shell-menu__separator" />
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={signOutBusy || undefined}
              className="ts-shell-menu__item ts-shell-menu__item--danger"
              onClick={() => {
                if (signOutBusy) return;
                popup.close();
                onSignOut();
              }}
            >
              <Icon name="logout" size={20} />
              <span className="ts-shell-menu__label">{labels.signOut}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
