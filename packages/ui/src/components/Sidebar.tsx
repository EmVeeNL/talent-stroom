import type { IconName } from "../icons.ts";
import { useId, useState } from "react";
import type { MouseEventHandler, ReactNode } from "react";
import { cx } from "../classnames.ts";
import { Icon } from "./Icon.tsx";
export interface SidebarItem {
  id: string;
  label: string;
  icon?: IconName;
  href?: string;
  children?: readonly SidebarItem[];
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}
export interface SidebarProps {
  label: string;
  items: readonly SidebarItem[];
  activeId?: string;
  collapsed?: boolean;
  workspace?: ReactNode;
  className?: string;
}
function Entry({ item, activeId, collapsed }: { item: SidebarItem; activeId: string | undefined; collapsed: boolean }) {
  const [open, setOpen] = useState(true);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const id = useId();
  const children = item.children;
  const label = (
    <>
      <Icon name={item.icon ?? "circle"} size={20} />
      <span className={collapsed ? "ts-visually-hidden" : undefined}>{item.label}</span>
    </>
  );
  return (
    <li>
      {children ? (
        <>
          <button
            type="button"
            aria-expanded={collapsed || open}
            aria-controls={id}
            onClick={() => setOpen(!open)}
            className="ts-sidebar__item"
            title={collapsed ? item.label : undefined}
            disabled={collapsed}
          >
            {label}
            {!collapsed ? <Icon name={open ? "expand_less" : "expand_more"} size={20} /> : null}
          </button>
          <ul id={id} hidden={!collapsed && !open}>
            {children.map((child) => (
              <Entry key={child.id} item={child} activeId={activeId} collapsed={collapsed} />
            ))}
          </ul>
        </>
      ) : (
        <a
          className="ts-sidebar__item"
          href={item.href}
          onClick={item.onClick}
          aria-current={activeId === item.id ? "page" : undefined}
          onFocus={() => setTooltipDismissed(false)}
          onMouseEnter={() => setTooltipDismissed(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setTooltipDismissed(true);
          }}
        >
          {label}
          {collapsed && !tooltipDismissed ? (
            <span className="ts-sidebar__tooltip" aria-hidden="true">
              {item.label}
            </span>
          ) : null}
        </a>
      )}
    </li>
  );
}
export function Sidebar({ label, items, activeId, collapsed = false, workspace, className }: SidebarProps) {
  return (
    <nav aria-label={label} className={cx("ts-sidebar", collapsed && "ts-sidebar--collapsed", className)}>
      {workspace ? <div className="ts-sidebar__workspace">{workspace}</div> : null}
      <ul>
        {items.map((item) => (
          <Entry key={item.id} item={item} activeId={activeId} collapsed={collapsed} />
        ))}
      </ul>
    </nav>
  );
}
