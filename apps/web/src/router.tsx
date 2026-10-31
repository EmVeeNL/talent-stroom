import type { QueryClient } from "@tanstack/react-query";
import { createContext, createElement, useContext, useEffect, Suspense, lazy } from "react";
import type { ReactNode } from "react";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  notFound,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import type { ErrorComponentProps, RouterHistory } from "@tanstack/react-router";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import type { OrganizationList } from "./auth.ts";
import type { SessionUser } from "./Workspace.tsx";
import type { AuthScreenProps } from "./pages/auth/AuthScreen.tsx";
import Pending, { RouteError as LazyRouteError } from "./RouteFeedback.tsx";
import { authRouteTitles, demoAuthRoutes, demoPagesEnabled, routes } from "./routes.ts";

export type SessionContext =
  | { kind: "loading" }
  | { kind: "guest" }
  | { kind: "ready"; data: OrganizationList; user: SessionUser }
  | { kind: "error"; message: MessageKey };
export interface RouterContext {
  queryClient?: QueryClient;
  session: SessionContext;
  resolveSession?: () => Promise<SessionContext>;
}
export interface AppView {
  session: SessionContext;
  locale: Locale;
  authProps: (path: string) => AuthScreenProps;
  renderCard: (path: string, children: ReactNode) => ReactNode;
}
declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    titleKey?: MessageKey;
    layout?: "auth" | "dashboard";
    access?: "public" | "member";
    demo?: boolean;
  }
}
export const ViewContext = createContext<AppView | null>(null);
function useView() {
  const context = useContext(ViewContext);
  if (!context) throw new Error("Missing application view context");
  return context;
}
export function activeMembership(session: SessionContext) {
  return session.kind === "ready"
    ? session.data.organizations.find((org) => org.organizationId === session.data.activeOrganizationId)
    : undefined;
}
const recovery = new Set(["/e-mail-bevestigen", "/wachtwoord-vergeten", "/wachtwoord-herstellen"]);
const publicPaths = new Set(["/inloggen", "/registreren", ...recovery]);
// React.lazy keeps suspension in React. Router 1.170.46 conditionally calls use()
// only while a chunk is pending, which violates React 19.3's suspension contract.
interface HarnessSearch {
  preview?: "dashboard" | "guest";
  theme?: "light" | "dark";
}
export function validateRouteSearch(search: Record<string, unknown>): HarnessSearch {
  if (!import.meta.env.DEV) return {};
  return {
    ...(search["preview"] === "dashboard" || search["preview"] === "guest" ? { preview: search["preview"] } : {}),
    ...(search["theme"] === "light" || search["theme"] === "dark" ? { theme: search["theme"] } : {}),
  };
}
const LazyNotFound = lazy(() => import("./pages/errors/NotFound.tsx"));

// Runs inside the page Suspense boundary, once the lazy heading exists.
function PageFocus() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    // Workspace already focuses its root heading. Never steal focus from a newly opened overlay.
    if (path === "/" || document.activeElement?.closest('[role="dialog"], [role="menu"], dialog[open]')) return;
    const heading = document.querySelector<HTMLElement>("main h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus();
  }, [path]);
  return null;
}
function SessionPending() {
  const context = useView();
  return context.session.kind === "loading" || context.session.kind === "error" ? null : <Pending />;
}
function Root() {
  const context = useView();
  if (context.session.kind === "loading" || context.session.kind === "error") return null;
  return <Outlet />;
}
function Layout() {
  const context = useView();
  const path = useRouterState({ select: (state) => state.location.pathname });
  return <Suspense fallback={<Pending />}>{context.renderCard(path, <Outlet />)}</Suspense>;
}
function NotFound() {
  const context = useView();
  return (
    <Suspense fallback={<Pending />}>
      <LazyNotFound locale={context.locale} />
      <PageFocus />
    </Suspense>
  );
}
function RouteError({ reset }: ErrorComponentProps) {
  return <LazyRouteError locale={useView().locale} onRetry={reset} />;
}
export function createAppRouter({
  history,
  demoEnabled = demoPagesEnabled,
  demoAuthEnabled = true,
  queryClient,
}: { history?: RouterHistory; demoEnabled?: boolean; demoAuthEnabled?: boolean; queryClient?: QueryClient } = {}) {
  // Start the public auth chunks alongside session bootstrap, rather than after the guard resolves.
  void import("./pages/auth/Login.tsx").catch(() => undefined);
  void import("./pages/auth/Register.tsx").catch(() => undefined);
  const root = createRootRouteWithContext<RouterContext>()({
    validateSearch: validateRouteSearch,
    errorComponent: RouteError,
    beforeLoad: async ({ context, location }) => {
      const path = location.pathname;
      if (demoEnabled && demoAuthEnabled && demoAuthRoutes.some((route) => route.path === path))
        return { session: context.session };
      const session = context.resolveSession ? await context.resolveSession() : context.session;
      if (session.kind === "guest" && !publicPaths.has(path)) throw redirect({ to: "/inloggen", replace: true });
      if (session.kind === "ready") {
        if (!activeMembership(session) && !recovery.has(path) && path !== "/organisatie-kiezen")
          throw redirect({ to: "/organisatie-kiezen", replace: true });
        if (activeMembership(session) && ["/inloggen", "/registreren"].includes(path))
          throw redirect({ to: "/", replace: true });
      }
      return { session };
    },
    pendingComponent: SessionPending,
    component: Root,
    notFoundComponent: NotFound,
  });
  const auth = createRoute({ getParentRoute: () => root, id: "auth", component: Layout });
  const dashboard = createRoute({
    getParentRoute: () => root,
    id: "dashboard",
    component: Layout,
    beforeLoad: ({ context }) => {
      if (context.session.kind === "guest") throw redirect({ to: "/inloggen", replace: true });
      if (context.session.kind === "ready" && !activeMembership(context.session))
        throw redirect({ to: "/organisatie-kiezen", replace: true });
    },
  });
  function page<const P extends string>(definition: {
    path: P;
    titleKey: MessageKey;
    layout: "dashboard";
    access: "member";
    demo?: boolean;
    load: () => Promise<{ default: (props: { locale: Locale }) => ReactNode }>;
  }) {
    const Page = lazy(definition.load);
    return createRoute({
      getParentRoute: () => dashboard,
      path: definition.path,
      staticData: {
        titleKey: definition.titleKey,
        layout: definition.layout,
        access: definition.access,
        demo: definition.demo ?? false,
      },
      beforeLoad: () => {
        if (definition.demo && !demoEnabled) throw notFound();
      },
      component: function LocalizedPage() {
        return (
          <>
            {createElement(Page, { locale: useView().locale })}
            <PageFocus />
          </>
        );
      },
    });
  }
  function demo<const P extends string>(definition: {
    path: P;
    titleKey: MessageKey;
    layout: "auth";
    access: "public";
    demo: boolean;
    load: () => Promise<{ default: (props: { locale: Locale }) => ReactNode }>;
  }) {
    const Page = lazy(definition.load);
    return createRoute({
      getParentRoute: () => root,
      path: definition.path,
      staticData: {
        titleKey: definition.titleKey,
        layout: definition.layout,
        access: definition.access,
        demo: definition.demo ?? false,
      },
      beforeLoad: () => {
        if (!demoEnabled || !demoAuthEnabled) throw notFound();
      },
      component: function LocalizedPage() {
        return (
          <>
            {createElement(Page, { locale: useView().locale })}
            <PageFocus />
          </>
        );
      },
    });
  }
  function authPage<const P extends keyof typeof authRouteTitles>(
    path: P,
    load: () => Promise<{ default: (props: AuthScreenProps) => ReactNode }>,
  ) {
    const Page = lazy(load);
    return createRoute({
      getParentRoute: () => auth,
      path,
      wrapInSuspense: false,
      staticData: { titleKey: authRouteTitles[path] ?? "auth.home", layout: "auth", access: "public" },
      component: function AuthPage() {
        return (
          <>
            <Page {...useView().authProps(path)} />
            <PageFocus />
          </>
        );
      },
    });
  }
  const tree = root.addChildren([
    auth.addChildren([
      authPage("/inloggen", () => import("./pages/auth/Login.tsx").then((m) => ({ default: m.Login }))),
      authPage("/registreren", () => import("./pages/auth/Register.tsx").then((m) => ({ default: m.Register }))),
      authPage("/e-mail-bevestigen", () =>
        import("./pages/auth/VerifyEmail.tsx").then((m) => ({ default: m.VerifyEmail })),
      ),
      authPage("/wachtwoord-vergeten", () =>
        import("./pages/auth/ForgotPassword.tsx").then((m) => ({ default: m.ForgotPassword })),
      ),
      authPage("/wachtwoord-herstellen", () =>
        import("./pages/auth/ResetPassword.tsx").then((m) => ({ default: m.ResetPassword })),
      ),
      createRoute({
        getParentRoute: () => auth,
        path: "/organisatie-kiezen",
        staticData: { titleKey: "auth.picker", layout: "auth", access: "public" },
      }),
    ]),
    dashboard.addChildren([
      page(routes[0]),
      page(routes[1]),
      page(routes[2]),
      page(routes[3]),
      page(routes[4]),
      page(routes[5]),
      page(routes[6]),
      page(routes[7]),
      page(routes[8]),
      page(routes[9]),
      page(routes[10]),
      page(routes[11]),
      page(routes[12]),
      page(routes[13]),
      page(routes[14]),
      page(routes[15]),
      page(routes[16]),
      page(routes[17]),
      page(routes[18]),
      page(routes[19]),
      page(routes[20]),
      page(routes[21]),
      page(routes[22]),
      page(routes[23]),
      page(routes[24]),
      page(routes[25]),
      page(routes[26]),
      page(routes[27]),
      page(routes[28]),
      page(routes[29]),
      page(routes[30]),
      page(routes[31]),
      page(routes[32]),
      page(routes[33]),
      page(routes[34]),
      page(routes[35]),
    ]),
    demo(demoAuthRoutes[0]),
    demo(demoAuthRoutes[1]),
    demo(demoAuthRoutes[2]),
    demo(demoAuthRoutes[3]),
  ]);
  return createRouter({
    routeTree: tree,
    search: { strict: true },
    context: { session: { kind: "loading" }, ...(queryClient ? { queryClient } : {}) },
    ...(history ? { history } : {}),
    defaultPendingComponent: Pending,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultPreload: false,
  });
}
export type AppRouter = ReturnType<typeof createAppRouter>;
declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
