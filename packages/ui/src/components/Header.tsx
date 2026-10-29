import type { ReactNode } from "react";
import { cx } from "../classnames.ts";
export interface HeaderProps {
  search?: ReactNode;
  notifications?: ReactNode;
  userMenu?: ReactNode;
  children?: ReactNode;
  className?: string;
}
export function Header({ search, notifications, userMenu, children, className }: HeaderProps) {
  return (
    <header role="banner" className={cx("ts-header", className)}>
      <div className="ts-header__search">{search}</div>
      {children}
      <div className="ts-header__actions">
        {notifications}
        {userMenu}
      </div>
    </header>
  );
}
