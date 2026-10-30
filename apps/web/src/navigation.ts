import type { MessageKey } from "@talentstroom/i18n";
import type { IconName, SidebarSection } from "@talentstroom/ui";
import { routes, visibleRoutes } from "./routes.ts";

export interface NavigationEntry {
  path: (typeof routes)[number]["path"];
  labelKey: MessageKey;
  icon: IconName;
  section: string;
  demo?: boolean;
}
export const navigation: readonly NavigationEntry[] = [
  { path: "/", labelKey: "nav.dashboard.recruitment", icon: "dashboard", section: "dashboard" },
  {
    path: "/dashboard/admin",
    labelKey: "nav.dashboard.admin",
    icon: "admin_panel_settings",
    section: "dashboard",
    demo: true,
  },
  {
    path: "/dashboard/medewerker",
    labelKey: "nav.dashboard.medewerker",
    icon: "person",
    section: "dashboard",
    demo: true,
  },
  { path: "/dashboard/deals", labelKey: "nav.dashboard.deals", icon: "handshake", section: "dashboard", demo: true },
  { path: "/dashboard/leads", labelKey: "nav.dashboard.leads", icon: "trending_up", section: "dashboard", demo: true },
  { path: "/dashboard/hr", labelKey: "nav.dashboard.hr", icon: "badge", section: "dashboard", demo: true },
  {
    path: "/dashboard/salaris",
    labelKey: "nav.dashboard.salarisadministratie",
    icon: "payments",
    section: "dashboard",
    demo: true,
  },
  {
    path: "/dashboard/aanwezigheid",
    labelKey: "nav.dashboard.aanwezigheid",
    icon: "event",
    section: "dashboard",
    demo: true,
  },
  { path: "/apps/agenda", labelKey: "nav.apps.agenda", icon: "calendar_month", section: "apps", demo: true },
  { path: "/apps/chat", labelKey: "nav.apps.chat", icon: "chat", section: "apps", demo: true },
  { path: "/apps/kanban", labelKey: "nav.apps.kanbanbord", icon: "view_kanban", section: "apps", demo: true },
  { path: "/apps/crm", labelKey: "nav.apps.crm", icon: "business", section: "apps", demo: true },
  { path: "/apps/notities", labelKey: "nav.apps.notities", icon: "edit", section: "apps", demo: true },
  { path: "/apps/contacten", labelKey: "nav.apps.contacten", icon: "contacts", section: "apps", demo: true },
  { path: "/elementen/basis", labelKey: "nav.elementen.basis", icon: "dashboard", section: "elementen", demo: true },
  {
    path: "/elementen/geavanceerd",
    labelKey: "nav.elementen.geavanceerd",
    icon: "settings",
    section: "elementen",
    demo: true,
  },
  { path: "/elementen/iconen", labelKey: "nav.elementen.iconen", icon: "star", section: "elementen", demo: true },
  {
    path: "/elementen/kaarten",
    labelKey: "nav.elementen.kaarten",
    icon: "grid_view",
    section: "elementen",
    demo: true,
  },
  {
    path: "/elementen/widgets",
    labelKey: "nav.elementen.widgets",
    icon: "grid_view",
    section: "elementen",
    demo: true,
  },
  {
    path: "/elementen/overzicht",
    labelKey: "nav.elementen.overzicht_design_kit",
    icon: "grid_view",
    section: "elementen",
    demo: true,
  },
  { path: "/data/tabellen", labelKey: "nav.data.tabellen", icon: "table_rows", section: "data", demo: true },
  { path: "/data/grafieken", labelKey: "nav.data.grafieken", icon: "bar_chart", section: "data", demo: true },
  { path: "/data/lijsten", labelKey: "nav.data.lijsten", icon: "checklist", section: "data", demo: true },
  { path: "/formulieren/basis", labelKey: "nav.formulieren.basis", icon: "edit", section: "formulieren", demo: true },
  {
    path: "/formulieren/geavanceerd",
    labelKey: "nav.formulieren.geavanceerd",
    icon: "settings",
    section: "formulieren",
    demo: true,
  },
  {
    path: "/formulieren/editors",
    labelKey: "nav.formulieren.editors",
    icon: "edit",
    section: "formulieren",
    demo: true,
  },
  {
    path: "/formulieren/groepen",
    labelKey: "nav.formulieren.groepen",
    icon: "groups",
    section: "formulieren",
    demo: true,
  },
  {
    path: "/formulieren/layout",
    labelKey: "nav.formulieren.layout",
    icon: "grid_view",
    section: "formulieren",
    demo: true,
  },
  {
    path: "/formulieren/validatie",
    labelKey: "nav.formulieren.validatie",
    icon: "verified_user",
    section: "formulieren",
    demo: true,
  },
  {
    path: "/paginas/authenticatie",
    labelKey: "nav.paginas.authenticatie",
    icon: "lock",
    section: "paginas",
    demo: true,
  },
  { path: "/paginas/fouten", labelKey: "nav.paginas.foutpaginas", icon: "error", section: "paginas", demo: true },
  { path: "/paginas/start", labelKey: "nav.paginas.startpagina", icon: "dashboard", section: "paginas", demo: true },
  { path: "/paginas/profiel", labelKey: "nav.paginas.profiel", icon: "account_circle", section: "paginas", demo: true },
  { path: "/paginas/prijzen", labelKey: "nav.paginas.prijzen", icon: "euro", section: "paginas", demo: true },
  { path: "/paginas/faq", labelKey: "nav.paginas.veelgestelde_vragen", icon: "help", section: "paginas", demo: true },
  { path: "/paginas/contact", labelKey: "nav.paginas.contact", icon: "mail", section: "paginas", demo: true },
];
const sectionLabels: Record<string, MessageKey> = {
  dashboard: "nav.group.dashboard",
  apps: "nav.group.apps",
  elementen: "nav.group.elementen",
  data: "nav.group.data",
  formulieren: "nav.group.formulieren",
  paginas: "nav.group.paginas",
};
const routePaths = new Set<string>(routes.map((route) => route.path));
export function navigationSections(tr: (key: MessageKey) => string, path: string, enabled?: boolean): SidebarSection[] {
  const enabledPaths = new Set<string>(visibleRoutes(enabled).map((route) => route.path));
  const groups = Object.keys(sectionLabels)
    .map((section) => {
      const group: SidebarSection = {
        id: section,
        label: tr(sectionLabels[section] ?? "nav.group.dashboard"),
        expandable: section === "dashboard",
        items: navigation
          .filter((entry) => entry.section === section && routePaths.has(entry.path) && enabledPaths.has(entry.path))
          .map((entry) => ({
            id: entry.path,
            icon: entry.icon,
            label: tr(entry.labelKey),
            href: entry.path,
            active: entry.path === path,
          })),
      };
      if (section === "dashboard") {
        group.icon = "dashboard";
        group.nested = true;
      }
      return group;
    })
    .filter((section) => section.items.length > 0);
  return groups;
}
