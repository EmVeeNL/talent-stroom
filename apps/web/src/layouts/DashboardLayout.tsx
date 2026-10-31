import { useDataLayer } from "../QueryProvider.tsx";
import { useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode, Ref } from "react";
import { LOCALES, t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import {
  AppShell,
  MotionContent,
  CommandPalette,
  LanguageMenu,
  NavbarIconButton,
  NavbarSearch,
  OrganizationSwitcher,
  SidebarAssistant,
  ThemeButton,
  UserMenu,
} from "@talentstroom/ui";
import { errorKey, isAborted, RequestError } from "../auth.ts";
import type { OrganizationList, Transport } from "../auth.ts";
import { navigationSections } from "../navigation.ts";
import type { IconName, SidebarSection } from "@talentstroom/ui";
import { ProductTour, PRODUCT_TOUR } from "../tour.tsx";

export interface SessionUser {
  id?: string;
  name: string;
  email: string;
}

type NavEntry = readonly [id: string, icon: IconName, label: MessageKey, path?: string];
const NAV: readonly { id: string; label?: MessageKey; items: readonly NavEntry[] }[] = [
  { id: "top", items: [["dashboard", "dashboard", "shell.nav.dashboard", "/"]] },
  {
    id: "recruitment",
    label: "shell.section.recruitment",
    items: [
      ["candidates", "group", "shell.nav.candidates"],
      ["vacancies", "work", "shell.nav.vacancies"],
      ["applications", "assignment", "shell.nav.applications"],
      ["placements", "work_history", "shell.nav.placements"],
      ["clients", "handshake", "shell.nav.clients"],
      ["talentPool", "person_search", "shell.nav.talentPool"],
    ],
  },
  {
    id: "activities",
    label: "shell.section.activities",
    items: [
      ["tasks", "task_alt", "shell.nav.tasks"],
      ["calendar", "calendar_month", "shell.nav.calendar"],
      ["conversations", "call", "shell.nav.conversations"],
      ["notes", "edit", "shell.nav.notes"],
    ],
  },
  {
    id: "reports",
    label: "shell.section.reports",
    items: [
      ["reports", "description", "shell.nav.reports"],
      ["statistics", "bar_chart", "shell.nav.statistics"],
    ],
  },
  {
    id: "admin",
    label: "shell.section.admin",
    items: [
      ["organization", "business", "shell.nav.organization"],
      ["users", "person", "shell.nav.users"],
      ["modules", "grid_view", "shell.nav.modules"],
      ["settings", "settings", "shell.nav.settings"],
    ],
  },
];

/** Shared navigation model; only routes that exist get a link, the rest are marked "Binnenkort". */
export function shellSections(
  tr: (key: MessageKey) => string,
  href?: (id: string) => string | undefined,
): SidebarSection[] {
  return NAV.map((section) => {
    const items = section.items.map(([id, icon, key, path]) => {
      const target = href ? href(id) : path;
      return target ? { id, icon, label: tr(key), href: target } : { id, icon, label: tr(key), soon: true };
    });
    return section.label ? { id: section.id, label: tr(section.label), items } : { id: section.id, items };
  });
}

export function shellLabels(tr: (key: MessageKey) => string) {
  return {
    collapse: tr("shell.collapse"),
    expand: tr("shell.expand"),
    openMenu: tr("shell.openMenu"),
    closeMenu: tr("shell.closeMenu"),
    skipToContent: tr("shell.skip"),
  };
}

export function DashboardLayout({
  locale,
  onLocaleChange,
  transport,
  data,
  user,
  signOutBusy,
  onSignOut,
  onChanged,
  onExpired,
  headingRef,
  currentPath = "/",
  children,
}: {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  transport: Transport;
  data: OrganizationList;
  user: SessionUser;
  signOutBusy: boolean;
  onSignOut: () => void;
  /** Called after a successful switch: the app discards scoped state and reloads session and memberships. */
  onChanged: () => void;
  onExpired: () => void;
  headingRef: Ref<HTMLHeadingElement>;
  currentPath?: string;
  children: ReactNode;
}) {
  const layer = useDataLayer();
  const matchedRoute = useRouterState({ select: (state) => state.matches.at(-1)?.id ?? "/" });
  const tr = (key: MessageKey) => t(locale, key);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey>();
  const active = data.organizations.find((org) => org.organizationId === data.activeOrganizationId);
  // Server-side switch rotates the session; on success all tenant-scoped client state is rebuilt.
  async function switchOrganization(orgId: string) {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    if (!layer) transport.cancel();
    const signal = transport.signal;
    try {
      if (layer) {
        await layer.changeOrganization(transport, { orgId });
        onChanged();
        return;
      }
      const result = await transport.api.POST("/v1/organizations/{orgId}/switch", {
        params: { path: { orgId } },
        signal,
      });
      signal.throwIfAborted();
      if (!result.data) throw new RequestError(result.response.status);
      onChanged();
    } catch (err) {
      if (isAborted(err)) return;
      if (err instanceof RequestError && err.status === 401) onExpired();
      else setError(errorKey(err));
    } finally {
      setBusy(false);
    }
  }
  const languages = LOCALES.map((value) => ({
    value,
    label: tr(value === "nl-NL" ? "auth.dutch" : "auth.english"),
    short: value === "nl-NL" ? "NL" : "EN",
  }));
  const languageName = languages.find((option) => option.value === locale)?.label ?? "";
  const changeLocale = (value: string) => {
    const next = LOCALES.find((candidate) => candidate === value);
    if (next) onLocaleChange(next);
  };
  return (
    <AppShell
      labels={shellLabels(tr)}
      sidebar={{
        label: tr("shell.navigation"),
        soonLabel: tr("shell.soon"),
        home: { href: "/", label: tr("shell.home") },
        sections: navigationSections(tr, useRouterState({ select: (state) => state.location.pathname })),
        footer: (
          <SidebarAssistant
            title={tr("shell.assistant.title")}
            description={tr("shell.assistant.description")}
            soonLabel={tr("shell.soon")}
          />
        ),
      }}
      header={{
        search: (
          <div data-tour="search">
            <CommandPalette
              label={tr("shell.searchTitle")}
              triggerLabel={tr("shell.searchTitle")}
              closeLabel={tr("shell.close")}
              emptyLabel={tr("shell.noResults")}
              actions={[
                {
                  id: "dashboard",
                  label: tr("shell.nav.dashboard"),
                  group: tr("shell.pages"),
                  onSelect: () => document.querySelector<HTMLElement>("main h1")?.focus(),
                },
              ]}
              renderTrigger={(props) => <NavbarSearch {...props} placeholder={tr("shell.search")} />}
            />
          </div>
        ),
        children: (
          <>
            {active ? (
              <OrganizationSwitcher
                organizations={data.organizations.map((org) => ({ id: org.organizationId, name: org.name }))}
                currentId={active.organizationId}
                labels={{
                  title: tr("shell.org.title"),
                  search: tr("shell.org.search"),
                  current: tr("shell.org.current"),
                  create: tr("shell.org.create"),
                  empty: tr("shell.org.empty"),
                  busy: tr("shell.org.busy"),
                }}
                onSelect={switchOrganization}
                createHref="/organisatie-kiezen"
                busy={busy}
                {...(error ? { error: tr(error) } : {})}
              />
            ) : null}
            <LanguageMenu label={tr("shell.language")} value={locale} options={languages} onChange={changeLocale} />
            <ThemeButton label={tr("shell.darkMode")} />
          </>
        ),
        notifications: (
          <>
            <NavbarIconButton
              icon="notifications"
              label={`${tr("shell.notifications")} (${tr("shell.soon")})`}
              aria-disabled
              className="ts-navbar-button--optional"
            />
            <NavbarIconButton
              icon="help"
              label={`${tr("shell.help")} (${tr("shell.soon")})`}
              aria-disabled
              className="ts-navbar-button--optional"
            />
          </>
        ),
        userMenu: (
          <UserMenu
            name={user.name || user.email || tr("shell.user.unknown")}
            {...(user.email ? { email: user.email } : {})}
            {...(active ? { organization: active.name } : {})}
            labels={{
              menu: tr("shell.user.menu"),
              profile: tr("shell.user.profile"),
              settings: tr("shell.user.settings"),
              darkMode: tr("shell.darkMode"),
              language: tr("shell.language"),
              shortcuts: tr("shell.user.shortcuts"),
              help: tr("shell.user.help"),
              signOut: tr("auth.signOut"),
              soon: tr("shell.soon"),
            }}
            languageName={languageName}
            onLanguageChange={() => changeLocale(locale === "nl-NL" ? "en-GB" : "nl-NL")}
            onSignOut={onSignOut}
            signOutBusy={signOutBusy}
          />
        ),
      }}
    >
      <MotionContent identity={`${data.activeOrganizationId}:${matchedRoute}`}>
        {currentPath === "/" && user.id ? <ProductTour userId={user.id} steps={PRODUCT_TOUR} locale={locale} /> : null}
        {currentPath === "/" ? (
          <h1 ref={headingRef} tabIndex={-1} className="ts-visually-hidden">
            {tr("auth.home")}
          </h1>
        ) : null}
        {children}
      </MotionContent>
    </AppShell>
  );
}
