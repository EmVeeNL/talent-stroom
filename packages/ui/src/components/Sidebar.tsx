import { NavigationLink } from "./NavigationLink.tsx";
import type { IconName } from "../icons.ts";
import { useEffect, useId, useRef, useState } from "react";
import type { MouseEventHandler, ReactNode } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
import { Logo } from "./Logo.tsx";

export interface SidebarItem {
  id: string;
  /** Translated label. */
  label: string;
  icon: IconName;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** Count badge, e.g. open tasks. */
  count?: number;
  /** Translated accessible text for the count, e.g. "3 open". Defaults to the number. */
  countLabel?: string;
  /** Destination does not exist yet: rendered as a disabled entry marked with `soonLabel`, never as a dead link. */
  soon?: boolean;
  active?: boolean;
}
export interface SidebarSection {
  id: string;
  /** Uppercase group label; omit for the top entries (Dashboard). */
  label?: string;
  items: readonly SidebarItem[];
  expandable?: boolean;
  icon?: IconName;
  nested?: boolean;
}
export interface SidebarProps {
  /** Accessible name of the navigation landmark. */
  label: string;
  sections: readonly SidebarSection[];
  activeId?: string;
  collapsed?: boolean;
  /** Translated "Binnenkort" marker for `soon` items. */
  soonLabel: string;
  /** Logo link to the start page. */
  home?: { href: string; label: string; onClick?: MouseEventHandler<HTMLAnchorElement> };
  /** Extra control next to the logo (the mobile drawer close button). */
  headerAction?: ReactNode;
  /** Bottom slot, e.g. `SidebarAssistant`. */
  footer?: ReactNode;
  id?: string;
  className?: string;
}

function Entry({
  item,
  active,
  collapsed,
  soonLabel,
  hideIcon,
}: {
  item: SidebarItem;
  active: boolean;
  collapsed: boolean;
  soonLabel: string;
  hideIcon: boolean;
}) {
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const entryRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!active || collapsed || !entryRef.current) return;
    const nav = entryRef.current.closest(".ts-sidebar__nav");
    if (!nav) return;
    const anchor = entryRef.current;
    const navRect = nav.getBoundingClientRect();
    const itemRect = anchor.getBoundingClientRect();
    if (itemRect.top < navRect.top || itemRect.bottom > navRect.bottom) {
      anchor.scrollIntoView({ block: "nearest" });
    }
  }, [active, collapsed]);
  const soon = item.soon || !item.href;
  const count =
    item.count !== undefined && item.count > 0 ? (
      <span className="ts-sidebar__count">
        <span aria-hidden="true">{item.count > 99 ? "99+" : item.count}</span>
        <span className="ts-visually-hidden">, {item.countLabel ?? String(item.count)}</span>
      </span>
    ) : null;
  const content = (
    <>
      {hideIcon ? null : <Icon name={item.icon} size={20} filled={active} />}
      <span className="ts-sidebar__label">{item.label}</span>
      {count}
      {soon ? (
        <span className="ts-sidebar__soon">
          <span className="ts-visually-hidden">, </span>
          {soonLabel}
        </span>
      ) : null}
      {collapsed && !tooltipDismissed ? (
        <span className="ts-sidebar__tooltip" aria-hidden="true">
          {item.label}
          {soon ? ` · ${soonLabel}` : ""}
        </span>
      ) : null}
    </>
  );
  const tooltip = {
    onFocus: () => setTooltipDismissed(false),
    onMouseEnter: () => setTooltipDismissed(false),
  };
  if (soon)
    return (
      <li>
        <span className="ts-sidebar__item" aria-disabled="true" {...tooltip}>
          {content}
        </span>
      </li>
    );
  return (
    <li>
      <NavigationLink
        ref={entryRef}
        className="ts-sidebar__item"
        href={item.href}
        onClick={item.onClick}
        aria-current={active ? "page" : undefined}
        {...tooltip}
        onKeyDown={(event) => {
          if (event.key === "Escape" && collapsed && !tooltipDismissed) {
            event.stopPropagation();
            setTooltipDismissed(true);
          }
        }}
      >
        {content}
      </NavigationLink>
    </li>
  );
}

function SectionView({
  section,
  index,
  uid,
  collapsed,
  activeId,
  soonLabel,
}: {
  section: SidebarSection;
  index: number;
  uid: string;
  collapsed: boolean;
  activeId: string | undefined;
  soonLabel: string;
}) {
  const activeChild = section.items.some((item) => item.active ?? item.id === activeId);
  const [open, setOpen] = useState(activeChild);
  const listId = `${uid}-${section.id}-items`;
  useEffect(() => {
    if (activeChild) setOpen(true);
  }, [activeChild]);
  return (
    <div className="ts-sidebar__section">
      {section.label ? (
        section.expandable ? (
          <button
            type="button"
            id={`${uid}-${section.id}`}
            className={cx(
              "ts-sidebar__heading",
              "ts-sidebar__heading-button",
              section.icon && "ts-sidebar__group-button",
              activeChild && "ts-sidebar__group-button--active",
            )}
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((value) => !value)}
          >
            {section.icon ? <Icon name={section.icon} size={20} filled={activeChild} /> : null}
            <span className={collapsed ? "ts-visually-hidden" : "ts-sidebar__group-label"}>{section.label}</span>
            <Icon name={open ? "expand_less" : "expand_more"} size={16} />
          </button>
        ) : (
          <p
            id={`${uid}-${section.id}`}
            className={cx("ts-sidebar__heading", collapsed && index > 0 && "ts-sidebar__heading--divider")}
          >
            <span className={collapsed ? "ts-visually-hidden" : undefined}>{section.label}</span>
          </p>
        )
      ) : null}
      <ul
        id={listId}
        className={section.nested ? "ts-sidebar__nested" : undefined}
        aria-labelledby={section.label ? `${uid}-${section.id}` : undefined}
        hidden={section.expandable && !open}
      >
        {section.items.map((item) => (
          <Entry
            key={item.id}
            item={item}
            active={item.active ?? activeId === item.id}
            collapsed={collapsed}
            soonLabel={soonLabel}
            hideIcon={section.nested ?? false}
          />
        ))}
      </ul>
    </div>
  );
}

/** Navy application sidebar (252 px, 68 px collapsed) with grouped sections. */
export function Sidebar({
  label,
  sections,
  activeId,
  collapsed = false,
  soonLabel,
  home,
  headerAction,
  footer,
  id,
  className,
}: SidebarProps) {
  const uid = useId();
  const logo = <Logo variant={collapsed ? "mark" : "full"} tone="dark" size="md" decorative />;
  return (
    <div id={id} className={cx("ts-sidebar", collapsed && "ts-sidebar--collapsed", className)}>
      <div className="ts-sidebar__brand">
        {home ? (
          <NavigationLink className="ts-sidebar__home" href={home.href} onClick={home.onClick} aria-label={home.label}>
            {logo}
          </NavigationLink>
        ) : (
          logo
        )}
        {headerAction}
      </div>
      <nav aria-label={label} className="ts-sidebar__nav">
        {sections.map((section, index) => (
          <SectionView
            key={section.id}
            section={section}
            index={index}
            uid={uid}
            collapsed={collapsed}
            activeId={activeId}
            soonLabel={soonLabel}
          />
        ))}
      </nav>
      {footer ? <div className="ts-sidebar__footer">{footer}</div> : null}
    </div>
  );
}

export interface SidebarAssistantProps {
  title: string;
  description: string;
  onClick?: () => void;
  /** Announced when there is no `onClick` yet. */
  soonLabel: string;
}

/** "AI Assistent — Stel een vraag…" card for the sidebar footer; icon-only inside a collapsed sidebar. */
export function SidebarAssistant({ title, description, onClick, soonLabel }: SidebarAssistantProps) {
  const disabled = !onClick;
  return (
    <button type="button" className="ts-sidebar-assistant" aria-disabled={disabled || undefined} onClick={onClick}>
      <Icon name="auto_awesome" size={24} filled className="ts-sidebar-assistant__icon" />
      <span className="ts-sidebar-assistant__text">
        <span className="ts-sidebar-assistant__title">{title}</span>{" "}
        <span className="ts-sidebar-assistant__description">
          {description}
          {disabled ? <span className="ts-visually-hidden">, {soonLabel}</span> : null}
        </span>
      </span>
      <Icon name="chevron_right" size={20} className="ts-sidebar-assistant__chevron" />
    </button>
  );
}
