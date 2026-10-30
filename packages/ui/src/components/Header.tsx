import type { ReactNode } from "react";
import { cx } from "../classnames.ts";
export interface HeaderProps {
  /** Leading control, e.g. the sidebar toggle. */
  start?: ReactNode;
  search?: ReactNode;
  /** Icon actions (language, theme, notifications, help). */
  children?: ReactNode;
  notifications?: ReactNode;
  /** Trailing user button, separated by a divider. */
  userMenu?: ReactNode;
  className?: string;
}
/** 64 px application navbar: start, search, actions and the user button. */
export function Header({ start, search, notifications, userMenu, children, className }: HeaderProps) {
  return (
    <header role="banner" className={cx("ts-header", className)}>
      {start ? <div className="ts-header__start">{start}</div> : null}
      <div className="ts-header__search">{search}</div>
      <div className="ts-header__actions">
        {children}
        {notifications}
        {userMenu ? <div className="ts-header__user">{userMenu}</div> : null}
      </div>
    </header>
  );
}
