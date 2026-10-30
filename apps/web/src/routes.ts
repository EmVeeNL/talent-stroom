import type { ComponentType } from "react";
import type { Locale, MessageKey } from "@talentstroom/i18n";

export interface RouteDef {
  path: string;
  titleKey: MessageKey;
  layout: "auth" | "dashboard";
  access: "public" | "member";
  demo?: boolean;
  load: () => Promise<{ default: ComponentType<{ locale: Locale }> }>;
}

export const routes = [
  {
    path: "/",
    titleKey: "nav.dashboard.recruitment",
    layout: "dashboard",
    access: "member",
    load: () => import("./pages/dashboard/Recruitment.tsx"),
  },
  {
    path: "/dashboard/admin",
    titleKey: "nav.dashboard.admin",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/dashboard/Admin.tsx"),
  },
  {
    path: "/dashboard/medewerker",
    titleKey: "nav.dashboard.medewerker",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/dashboard/Medewerker.tsx"),
  },
  {
    path: "/dashboard/deals",
    titleKey: "nav.dashboard.deals",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/dashboard/Deals.tsx"),
  },
  {
    path: "/dashboard/leads",
    titleKey: "nav.dashboard.leads",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/dashboard/Leads.tsx"),
  },
  {
    path: "/dashboard/hr",
    titleKey: "nav.dashboard.hr",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/dashboard/HR.tsx"),
  },
  {
    path: "/dashboard/salaris",
    titleKey: "nav.dashboard.salarisadministratie",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/dashboard/Salarisadministratie.tsx"),
  },
  {
    path: "/dashboard/aanwezigheid",
    titleKey: "nav.dashboard.aanwezigheid",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/dashboard/Aanwezigheid.tsx"),
  },
  {
    path: "/apps/agenda",
    titleKey: "nav.apps.agenda",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/apps/Agenda.tsx"),
  },
  {
    path: "/apps/chat",
    titleKey: "nav.apps.chat",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/apps/Chat.tsx"),
  },
  {
    path: "/apps/kanban",
    titleKey: "nav.apps.kanbanbord",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/apps/Kanbanbord.tsx"),
  },
  {
    path: "/apps/crm",
    titleKey: "nav.apps.crm",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/apps/CRM.tsx"),
  },
  {
    path: "/apps/notities",
    titleKey: "nav.apps.notities",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/apps/Notities.tsx"),
  },
  {
    path: "/apps/contacten",
    titleKey: "nav.apps.contacten",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/apps/Contacten.tsx"),
  },
  {
    path: "/elementen/basis",
    titleKey: "nav.elementen.basis",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/elementen/Basis.tsx"),
  },
  {
    path: "/elementen/geavanceerd",
    titleKey: "nav.elementen.geavanceerd",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/elementen/Geavanceerd.tsx"),
  },
  {
    path: "/elementen/iconen",
    titleKey: "nav.elementen.iconen",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/elementen/Iconen.tsx"),
  },
  {
    path: "/elementen/kaarten",
    titleKey: "nav.elementen.kaarten",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/elementen/Kaarten.tsx"),
  },
  {
    path: "/elementen/widgets",
    titleKey: "nav.elementen.widgets",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/elementen/Widgets.tsx"),
  },
  {
    path: "/elementen/overzicht",
    titleKey: "nav.elementen.overzicht_design_kit",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/elementen/OverzichtDesignKit.tsx"),
  },
  {
    path: "/data/tabellen",
    titleKey: "nav.data.tabellen",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/data/Tabellen.tsx"),
  },
  {
    path: "/data/grafieken",
    titleKey: "nav.data.grafieken",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/data/Grafieken.tsx"),
  },
  {
    path: "/data/lijsten",
    titleKey: "nav.data.lijsten",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/data/Lijsten.tsx"),
  },
  {
    path: "/formulieren/basis",
    titleKey: "nav.formulieren.basis",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/formulieren/Basis.tsx"),
  },
  {
    path: "/formulieren/geavanceerd",
    titleKey: "nav.formulieren.geavanceerd",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/formulieren/Geavanceerd.tsx"),
  },
  {
    path: "/formulieren/editors",
    titleKey: "nav.formulieren.editors",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/formulieren/Editors.tsx"),
  },
  {
    path: "/formulieren/groepen",
    titleKey: "nav.formulieren.groepen",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/formulieren/Groepen.tsx"),
  },
  {
    path: "/formulieren/layout",
    titleKey: "nav.formulieren.layout",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/formulieren/Layout.tsx"),
  },
  {
    path: "/formulieren/validatie",
    titleKey: "nav.formulieren.validatie",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/formulieren/Validatie.tsx"),
  },
  {
    path: "/paginas/authenticatie",
    titleKey: "nav.paginas.authenticatie",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/paginas/Authenticatie.tsx"),
  },
  {
    path: "/paginas/fouten",
    titleKey: "nav.paginas.foutpaginas",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/paginas/Foutpaginas.tsx"),
  },
  {
    path: "/paginas/start",
    titleKey: "nav.paginas.startpagina",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/paginas/Startpagina.tsx"),
  },
  {
    path: "/paginas/profiel",
    titleKey: "nav.paginas.profiel",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/paginas/Profiel.tsx"),
  },
  {
    path: "/paginas/prijzen",
    titleKey: "nav.paginas.prijzen",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/paginas/Prijzen.tsx"),
  },
  {
    path: "/paginas/faq",
    titleKey: "nav.paginas.veelgestelde_vragen",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/paginas/VeelgesteldeVragen.tsx"),
  },
  {
    path: "/paginas/contact",
    titleKey: "nav.paginas.contact",
    layout: "dashboard",
    access: "member",
    demo: true,
    load: () => import("./pages/paginas/Contact.tsx"),
  },
] as const satisfies readonly RouteDef[];

export const demoAuthRoutes = [
  {
    path: "/paginas/authenticatie/tweestaps",
    titleKey: "auth.login",
    layout: "auth",
    access: "public",
    demo: true,
    load: () => import("./pages/auth/TwoStep.tsx"),
  },
  {
    path: "/paginas/authenticatie/vergrendeld",
    titleKey: "auth.login",
    layout: "auth",
    access: "public",
    demo: true,
    load: () => import("./pages/auth/LockScreen.tsx"),
  },
  {
    path: "/paginas/authenticatie/uitgelogd",
    titleKey: "auth.login",
    layout: "auth",
    access: "public",
    demo: true,
    load: () => import("./pages/auth/Logout.tsx"),
  },
  {
    path: "/paginas/authenticatie/gelukt",
    titleKey: "auth.login",
    layout: "auth",
    access: "public",
    demo: true,
    load: () => import("./pages/auth/Success.tsx"),
  },
] as const satisfies readonly RouteDef[];

export const authRouteTitles = {
  "/inloggen": "auth.login",
  "/registreren": "auth.register",
  "/e-mail-bevestigen": "auth.verify",
  "/wachtwoord-vergeten": "auth.forgot",
  "/wachtwoord-herstellen": "auth.reset",
  "/organisatie-kiezen": "auth.picker",
} as const satisfies Record<string, MessageKey>;
const demoDefault = import.meta.env.DEV;
export const demoPagesEnabled =
  import.meta.env["VITE_DEMO_PAGES"] === undefined ? demoDefault : import.meta.env["VITE_DEMO_PAGES"] === "true";
const AuthRouteMarker: ComponentType<{ locale: Locale }> = () => null;
export const routeTable: readonly RouteDef[] = [
  ...Object.entries(authRouteTitles).map(([path, titleKey]) => ({
    path,
    titleKey,
    layout: "auth" as const,
    access: "public" as const,
    load: async () => ({ default: AuthRouteMarker }),
  })),
  ...routes,
  ...(demoPagesEnabled ? demoAuthRoutes : []),
  {
    path: "*",
    titleKey: "nav.not_found.title",
    layout: "dashboard",
    access: "member",
    load: () => import("./pages/errors/NotFound.tsx"),
  },
];
export const routeTitles = Object.fromEntries(
  routeTable.filter(({ path }) => path !== "*").map(({ path, titleKey }) => [path, titleKey]),
) as Record<string, MessageKey>;
export const knownTitles = { ...authRouteTitles, ...routeTitles };
export function visibleRoutes(enabled = demoPagesEnabled): readonly RouteDef[] {
  return routes.filter((route) => !("demo" in route && route.demo) || enabled);
}
export function findRoute(path: string, enabled = demoPagesEnabled): RouteDef | undefined {
  return visibleRoutes(enabled).find((route) => route.path === path);
}
