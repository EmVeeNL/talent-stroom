import { useEffect, useId, useRef, useState } from "react";
import type { MouseEventHandler } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
import { initials, useShellPopup } from "./shellPopup.ts";

export interface OrganizationOption {
  id: string;
  name: string;
}
export interface OrganizationSwitcherLabels {
  /** Trigger accessible name prefix and popover title, e.g. "Switch organisatie". */
  title: string;
  search: string;
  /** Under the current organization, e.g. "Huidige organisatie". */
  current: string;
  /** "+ Nieuwe organisatie". */
  create: string;
  empty: string;
  /** Busy announcement while switching. */
  busy: string;
}
export interface OrganizationSwitcherProps {
  organizations: readonly OrganizationOption[];
  currentId: string;
  labels: OrganizationSwitcherLabels;
  /** Called for a different organization; the app switches server-side and resets scoped state. */
  onSelect: (id: string) => void | Promise<void>;
  /** "+ Nieuwe organisatie" destination. */
  createHref?: string;
  onCreate?: MouseEventHandler<HTMLAnchorElement>;
  busy?: boolean;
  /** Translated error shown inside the popover. */
  error?: string;
  /** Hide the name in the trigger (mobile navbar). */
  compact?: boolean;
  defaultOpen?: boolean;
}

const tones = ["primary", "accent", "navy", "warning", "info", "sky"] as const;
function tone(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return tones[Math.abs(hash) % tones.length];
}

/** Organization switcher popover: searchable listbox (combobox pattern), current organization checked. */
export function OrganizationSwitcher({
  organizations,
  currentId,
  labels,
  onSelect,
  createHref,
  onCreate,
  busy = false,
  error,
  compact = false,
  defaultOpen = false,
}: OrganizationSwitcherProps) {
  const id = useId();
  const popup = useShellPopup(defaultOpen);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  // The highlight ring only shows once the keyboard moves it; the kit's resting state shows the tinted current row.
  const [navigated, setNavigated] = useState(false);
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      organizations.findIndex((org) => org.id === currentId),
    ),
  );
  const current = organizations.find((org) => org.id === currentId);
  const filtered = organizations.filter((org) => org.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const highlighted = filtered[Math.min(active, filtered.length - 1)];
  const { open } = popup;
  useEffect(() => {
    if (open && !defaultOpen) input.current?.focus();
  }, [open, defaultOpen]);
  const toggle = () => {
    if (!open) {
      setQuery("");
      setNavigated(false);
      setActive(
        Math.max(
          0,
          organizations.findIndex((org) => org.id === currentId),
        ),
      );
    }
    popup.setOpen(!open);
  };
  const choose = (org: OrganizationOption) => {
    if (busy) return;
    if (org.id === currentId) {
      popup.close();
      return;
    }
    void onSelect(org.id);
  };
  return (
    <div ref={popup.root} className="ts-shell-anchor">
      <button
        ref={popup.trigger}
        type="button"
        className={cx("ts-org-trigger", compact && "ts-org-trigger--compact")}
        aria-haspopup="dialog"
        aria-expanded={popup.open}
        aria-controls={popup.open ? `${id}-dialog` : undefined}
        aria-label={`${labels.title}: ${current?.name ?? ""}`}
        onClick={toggle}
      >
        <Icon name="business" size={20} />
        <span className="ts-org-trigger__name" aria-hidden="true">
          {current?.name}
        </span>
        <Icon name="expand_more" size={20} />
      </button>
      {popup.open ? (
        <div
          id={`${id}-dialog`}
          role="dialog"
          aria-labelledby={`${id}-title`}
          aria-busy={busy || undefined}
          className="ts-shell-popup ts-org-switcher"
        >
          <h2 id={`${id}-title`} className="ts-org-switcher__title">
            {labels.title}
          </h2>
          <div className="ts-org-switcher__search">
            <Icon name="search" size={20} />
            <input
              ref={input}
              type="search"
              role="combobox"
              aria-label={labels.search}
              placeholder={labels.search}
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-autocomplete="list"
              aria-activedescendant={highlighted ? `${id}-${highlighted.id}` : undefined}
              autoComplete="off"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                const last = filtered.length - 1;
                const index = Math.min(active, last);
                const next: Record<string, number> = {
                  ArrowDown: index >= last ? 0 : index + 1,
                  ArrowUp: index <= 0 ? last : index - 1,
                  Home: 0,
                  End: last,
                };
                if (event.key in next && filtered.length) {
                  event.preventDefault();
                  setNavigated(true);
                  setActive(next[event.key] ?? 0);
                } else if (event.key === "Enter" && highlighted) {
                  event.preventDefault();
                  choose(highlighted);
                }
              }}
            />
          </div>
          {error ? (
            <p role="alert" className="ts-org-switcher__error">
              {error}
            </p>
          ) : null}
          <div role="listbox" id={`${id}-list`} aria-label={labels.title} className="ts-org-switcher__list">
            {filtered.map((org) => {
              const selected = org.id === currentId;
              return (
                <div
                  key={org.id}
                  id={`${id}-${org.id}`}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={busy || undefined}
                  className={cx("ts-org-switcher__option", navigated && highlighted?.id === org.id && "is-active")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(org)}
                >
                  <span className={`ts-org-avatar ts-org-avatar--${tone(org.id)}`} aria-hidden="true">
                    {initials(org.name)}
                  </span>
                  <span className="ts-org-switcher__text">
                    <span className="ts-org-switcher__name">{org.name}</span>
                    {selected ? <span className="ts-org-switcher__current">{labels.current}</span> : null}
                  </span>
                  {selected ? <Icon name="check" size={20} className="ts-org-switcher__check" /> : null}
                </div>
              );
            })}
          </div>
          {!filtered.length ? (
            <p role="status" className="ts-org-switcher__empty">
              {labels.empty}
            </p>
          ) : null}
          {busy ? (
            <p role="status" className="ts-visually-hidden">
              {labels.busy}
            </p>
          ) : null}
          {createHref ? (
            <a className="ts-org-switcher__create" href={createHref} onClick={onCreate}>
              <Icon name="add" size={20} />
              {labels.create}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
