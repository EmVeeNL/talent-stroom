import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode, Ref } from "react";
import { cx } from "../classnames.ts";
import { Header } from "./Header.tsx";
import type { HeaderProps } from "./Header.tsx";
import { NavbarIconButton } from "./Navbar.tsx";
import { Sidebar } from "./Sidebar.tsx";
import type { SidebarProps } from "./Sidebar.tsx";
import { focusable } from "./floating.ts";

const MOBILE_QUERY = "(max-width: 767px)";
function matches(query: string) {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}
/** True below the 768 px breakpoint, where the sidebar becomes an overlay drawer. */
export function useIsMobile() {
  const [mobile, setMobile] = useState(() => matches(MOBILE_QUERY));
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  return mobile;
}

export interface AppShellLabels {
  /** Toggle names: "Zijbalk inklappen" / "Zijbalk uitklappen". */
  collapse: string;
  expand: string;
  /** Mobile drawer: "Menu openen" / "Menu sluiten". */
  openMenu: string;
  closeMenu: string;
  /** "Naar hoofdinhoud" skip link. */
  skipToContent: string;
}
export interface AppShellProps {
  /** Sidebar props; a `SidebarAssistant` footer adapts to the collapsed rail by itself. */
  sidebar: Omit<SidebarProps, "collapsed" | "id" | "headerAction">;
  /** Navbar slots; `start` is reserved for the sidebar toggle. */
  header: Omit<HeaderProps, "start" | "className">;
  labels: AppShellLabels;
  children: ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Force the mobile layout (gallery previews); defaults to the viewport media query. */
  mobile?: boolean;
  className?: string;
}

/** Application shell: navy sidebar, 64 px navbar and the main content area. */
export function AppShell({
  sidebar,
  header,
  labels,
  children,
  collapsed: controlled,
  defaultCollapsed = false,
  onCollapsedChange,
  mobile: forcedMobile,
  className,
}: AppShellProps) {
  const id = useId();
  const sidebarId = `${id}-sidebar`;
  const mainId = `${id}-main`;
  const viewportMobile = useIsMobile();
  const mobile = forcedMobile ?? viewportMobile;
  const [uncontrolled, setUncontrolled] = useState(defaultCollapsed);
  const collapsedPreference = controlled ?? uncontrolled;
  const collapsed = !mobile && collapsedPreference;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const closeDrawer = () => {
    setDrawerOpen(false);
    toggle.current?.focus();
  };
  useEffect(() => {
    if (!mobile) setDrawerOpen(false);
  }, [mobile]);
  useEffect(() => {
    if (drawerOpen) drawer.current?.querySelector<HTMLElement>(focusable)?.focus();
  }, [drawerOpen]);
  const trap = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!drawerOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeDrawer();
      return;
    }
    if (event.key !== "Tab") return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>(focusable)];
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  const drawerProps = drawerOpen
    ? ({ role: "dialog", "aria-modal": true, "aria-label": sidebar.label } as const)
    : ({} as const);
  return (
    <div
      className={cx(
        "ts-app-shell",
        collapsed && "ts-app-shell--collapsed",
        mobile && "ts-app-shell--mobile",
        className,
      )}
    >
      <a className="ts-app-shell__skip" href={`#${mainId}`}>
        {labels.skipToContent}
      </a>
      <div
        ref={drawer}
        className={cx("ts-app-shell__sidebar", drawerOpen && "is-open")}
        hidden={mobile && !drawerOpen}
        onKeyDown={trap}
        {...drawerProps}
      >
        <Sidebar
          {...sidebar}
          id={sidebarId}
          collapsed={collapsed}
          headerAction={
            drawerOpen ? (
              <NavbarIconButton
                icon="close"
                label={labels.closeMenu}
                className="ts-app-shell__close"
                onClick={closeDrawer}
              />
            ) : undefined
          }
        />
      </div>
      {drawerOpen ? <div className="ts-app-shell__scrim" aria-hidden="true" onClick={closeDrawer} /> : null}
      <div className="ts-app-shell__body" inert={drawerOpen || undefined}>
        <Header
          {...header}
          start={
            <NavbarIconButton
              ref={toggle}
              icon={mobile ? "menu" : collapsed ? "menu" : "menu_open"}
              label={mobile ? labels.openMenu : collapsed ? labels.expand : labels.collapse}
              aria-controls={sidebarId}
              aria-expanded={mobile ? drawerOpen : !collapsed}
              onClick={() => {
                if (mobile) {
                  setDrawerOpen(true);
                  return;
                }
                setUncontrolled(!collapsed);
                onCollapsedChange?.(!collapsed);
              }}
            />
          }
        />
        <main id={mainId} tabIndex={-1} className="ts-app-shell__main">
          <div className="ts-app-shell__content">{children}</div>
        </main>
      </div>
    </div>
  );
}

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Heading props, e.g. a ref and tabIndex for focus management after navigation. */
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
}
/** Page header: H1 (30/38) with subtitle and right-aligned actions. */
export function PageHeader({ title, subtitle, actions, headingRef, className }: PageHeaderProps) {
  return (
    <div className={cx("ts-page-header", className)}>
      <div className="ts-page-header__text">
        <h1 ref={headingRef} tabIndex={headingRef ? -1 : undefined} className="ts-page-header__title">
          {title}
        </h1>
        {subtitle ? <p className="ts-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ts-page-header__actions">{actions}</div> : null}
    </div>
  );
}
