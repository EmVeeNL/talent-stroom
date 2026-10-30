import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALES, t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { Button, Icon, Logo, Select, ThemeToggle, NavigationLinkContext } from "@talentstroom/ui";
import { createTransport, errorKey, isAborted, listOrganizations, RequestError } from "./auth.ts";
import { RouterProvider, useRouterState } from "@tanstack/react-router";
import { createAppRouter, activeMembership, ViewContext } from "./router.tsx";
import type { AppRouter, AppView, SessionContext } from "./router.tsx";
import type { ReactNode } from "react";
import { RouterAnchor, Link } from "./Link.tsx";
import { Workspace } from "./Workspace.tsx";
import type { SessionUser } from "./Workspace.tsx";
import { AuthLayout } from "./layouts/AuthLayout.tsx";
import { AuthHero } from "./layouts/AuthHero.tsx";
import { authRouteTitles, demoAuthRoutes, demoPagesEnabled, findRoute, knownTitles } from "./routes.ts";
import "./auth.css";

const OrganizationPicker = lazy(() =>
  import("./pages/auth/OrganizationPicker.tsx").then((module) => ({ default: module.OrganizationPicker })),
);

// Dev-only component showcase: ?gallery. Tree-shaken from production builds.
const ComponentGallery = import.meta.env.DEV
  ? lazy(() => import("./gallery/Gallery.tsx").then((m) => ({ default: m.Gallery })))
  : null;
export function App() {
  if (ComponentGallery && new URLSearchParams(window.location.search).has("gallery")) {
    return (
      <Suspense fallback={null}>
        <ComponentGallery />
      </Suspense>
    );
  }
  return <AuthApp />;
}
/** Display name and email from the Better Auth session (kept in memory only). */
function readUser(session: object): SessionUser {
  const user: unknown = "user" in session ? session.user : undefined;
  const field = (key: string) => {
    const value: unknown =
      user && typeof user === "object" ? Object.getOwnPropertyDescriptor(user, key)?.value : undefined;
    return typeof value === "string" ? value : "";
  };
  return { name: field("name"), email: field("email") };
}
function AuthApp() {
  // Capture one-use callback data before Router can parse/cache the URL. Keep it only in memory.
  const [callback, setCallback] = useState(() => {
    const query = window.location.search;
    const path = window.location.pathname;
    return { path, query };
  });
  const [harness] = useState(() => {
    if (!import.meta.env.DEV) return null;
    const value = new URLSearchParams(window.location.search).get("preview");
    return value === "dashboard" || value === "guest" ? value : null;
  });
  const initialCallback = useRef(callback);
  const [router, setRouter] = useState<AppRouter>();
  useEffect(() => {
    const captured = initialCallback.current;
    const params = new URLSearchParams(captured.query);
    if (params.has("token") || params.has("error")) window.history.replaceState(null, "", captured.path);
    const current = createAppRouter({ demoAuthEnabled: harness !== "dashboard" });
    initialCallback.current = { path: captured.path, query: "" };
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) setRouter(current);
    });
    return () => {
      mounted = false;
      current.history.destroy();
    };
  }, [harness]);
  const demoAuth =
    demoPagesEnabled &&
    demoAuthRoutes.some((route) => route.path === window.location.pathname) &&
    harness !== "dashboard";
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [transport, setTransport] = useState(() => {
    const current = createTransport();
    if (harness === "guest" || harness === "dashboard") {
      current.auth = async () => null;
      // Harness interactions must never send synthetic scope to the real API.
      current.api.use({ onRequest: () => Response.json({}, { status: 503 }) });
    }
    return current;
  });
  const [context, setContext] = useState<SessionContext>(() => {
    if (import.meta.env.DEV && harness === "dashboard") {
      const orgId = "11111111-1111-4111-8111-111111111111";
      return {
        kind: "ready",
        user: { name: "Michael de Vries", email: "michael@example.test" },
        data: {
          activeOrganizationId: orgId,
          organizations: [
            {
              organizationId: orgId,
              membershipId: "22222222-2222-4222-8222-222222222222",
              name: "TalentStroom Demo",
              slug: "talentstroom-demo",
              role: "owner",
            },
          ],
        },
      };
    }
    return harness === "guest" || demoAuth ? { kind: "guest" } : { kind: "loading" };
  });
  const sessionGate = useRef(Promise.withResolvers<SessionContext>());
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [actionError, setActionError] = useState<MessageKey>();
  const heading = useRef<HTMLHeadingElement>(null);
  const tr = (key: MessageKey) => t(locale, key);
  function navigate(path: "/" | "/inloggen", replace = false) {
    void router?.navigate({ to: path, replace });
    setActionError(undefined);
  }
  useEffect(() => {
    document.documentElement.lang = locale;
    const theme = new URLSearchParams(window.location.search).get("theme");
    if (import.meta.env.DEV && (theme === "light" || theme === "dark"))
      document.documentElement.dataset["theme"] = theme;
  }, [locale]);
  useEffect(() => {
    if (harness || demoAuth) return () => transport.cancel();
    const signal = transport.signal;
    async function load() {
      try {
        const session = await transport.auth("get-session", undefined, DEFAULT_LOCALE, signal);
        if (signal.aborted) return;
        if (!session || typeof session !== "object" || !("user" in session)) {
          setContext({ kind: "guest" });
          sessionGate.current.resolve({ kind: "guest" });
          return;
        }
        const data = await listOrganizations(transport, signal);
        if (!signal.aborted) {
          const next = { kind: "ready" as const, data, user: readUser(session) };
          sessionGate.current.resolve(next);
          setContext(next);
        }
      } catch (err) {
        if (isAborted(err) || signal.aborted) return;
        const next: SessionContext =
          err instanceof RequestError && err.status === 401
            ? { kind: "guest" }
            : { kind: "error", message: errorKey(err) };
        sessionGate.current.resolve(next);
        setContext(next);
      }
    }
    void load();
    return () => transport.cancel();
  }, [transport, harness, demoAuth]);

  const active = activeMembership(context);
  // Guards are UX only: every organization-owned API read/write must verify membership and scope server-side.
  // Session/organization state stays in the existing auth lifecycle; #424 adds Query.
  const routerContext: AppView = {
    session: context,
    locale,
    authProps: (path) => ({
      locale,
      transport,
      onSignedIn: refresh,
      query: callback.path === path ? callback.query : "",
    }),
    renderFrame,
  };
  useEffect(() => {
    if (!router) return;
    router.update({
      context: {
        session: context,
        resolveSession: () => (context.kind === "loading" ? sessionGate.current.promise : Promise.resolve(context)),
      },
    });
    router.clearCache();
    void router.invalidate();
  }, [router, context]);
  useEffect(
    () =>
      router?.subscribe("onResolved", ({ toLocation }) => {
        setActionError(undefined);
        setCallback((current) =>
          current.path === toLocation.pathname ? current : { path: toLocation.pathname, query: "" },
        );
      }),
    [router],
  );
  function refresh() {
    if (harness) {
      navigate("/", true);
      return;
    }
    transport.cancel();
    sessionGate.current = Promise.withResolvers<SessionContext>();
    setContext({ kind: "loading" });
    setTransport(createTransport());
    navigate("/", true);
  }
  function expire() {
    transport.cancel();
    setContext({ kind: "guest" });
    navigate("/inloggen", true);
  }
  async function signOut() {
    if (signOutBusy) return;
    setSignOutBusy(true);
    setActionError(undefined);
    transport.cancel();
    try {
      await transport.auth("sign-out", {}, locale);
      expire();
    } catch (err) {
      if (!isAborted(err)) setActionError(errorKey(err));
    } finally {
      setSignOutBusy(false);
    }
  }
  const controls = (
    <>
      <Select
        label={tr("auth.language")}
        value={locale}
        onChange={(event) => {
          if (isLocale(event.target.value)) setLocale(event.target.value);
        }}
      >
        {LOCALES.map((value) => (
          <option key={value} value={value}>
            {tr(value === "nl-NL" ? "auth.dutch" : "auth.english")}
          </option>
        ))}
      </Select>
      <ThemeToggle
        label={tr("auth.theme")}
        labels={{ system: tr("auth.system"), light: tr("auth.light"), dark: tr("auth.dark") }}
      />
    </>
  );
  const picker =
    context.kind === "ready" ? (
      <OrganizationPicker
        data={context.data}
        locale={locale}
        transport={transport}
        onChanged={refresh}
        onExpired={expire}
      />
    ) : null;
  if (!router) return <output>{tr("auth.loading")}</output>;
  return (
    <ViewContext value={routerContext}>
      <NavigationLinkContext value={RouterAnchor}>
        <RouterProvider
          router={router}
          context={{
            session: context,
            resolveSession: () => (context.kind === "loading" ? sessionGate.current.promise : Promise.resolve(context)),
          }}
        />
      </NavigationLinkContext>
    </ViewContext>
  );

  function renderFrame(path: string, children: ReactNode) {
    const currentRoute = findRoute(path);
    if (active && context.kind === "ready" && (currentRoute || !Object.hasOwn(authRouteTitles, path))) {
      return (
        <Workspace
          locale={locale}
          onLocaleChange={setLocale}
          transport={transport}
          data={context.data}
          user={context.user}
          signOutBusy={signOutBusy}
          onSignOut={() => void signOut()}
          onChanged={refresh}
          onExpired={expire}
          headingRef={heading}
          currentPath={path}
        >
          <PageEffects path={path} locale={locale} heading={heading} />
          {actionError && (
            <p role="alert" className="workspace-alert">
              {tr(actionError)}
            </p>
          )}
          {children}
        </Workspace>
      );
    }
    return (
      <AuthLayout
        controls={controls}
        hero={
          <>
            <AuthHero />
            <Link to="/inloggen" className="auth-wordmark" aria-label={tr("app.name")}>
              <Logo tone="dark" size="lg" />
            </Link>
            <div className="auth-brand-copy">
              <h2 className="auth-brand-title">{tr("auth.brandLine")}</h2>
              <p>{tr("auth.brandText")}</p>
              <ul className="auth-benefits">
                {(
                  [
                    ["auth.valueSpeed", "task_alt"],
                    ["auth.valueShortlist", "description"],
                    ["auth.valuePipeline", "bar_chart"],
                    ["auth.valueShare", "groups"],
                  ] as const
                ).map(([key, icon]) => (
                  <li key={key}>
                    <span className="auth-benefit-icon">
                      <Icon name={icon} size={24} />
                    </span>
                    {tr(key)}
                  </li>
                ))}
              </ul>
            </div>
          </>
        }
      >
        <PageEffects path={path} locale={locale} heading={heading} />
        <main className="auth-content">
          <section className="auth-card">
            <Logo className="auth-card-logo" size="md" />
            {context.kind === "loading" ? (
              <output>{tr("auth.loading")}</output>
            ) : (
              <>
                <h1 ref={heading} tabIndex={-1}>
                  {tr(
                    context.kind === "error"
                      ? "auth.sessionError"
                      : ((authRouteTitles as Record<string, MessageKey>)[path] ?? "auth.home"),
                  )}
                </h1>
                {actionError && <p role="alert">{tr(actionError)}</p>}
                {context.kind === "error" ? (
                  <>
                    <p role="alert">{tr(context.message)}</p>
                    <Button onClick={refresh}>{tr("auth.retry")}</Button>
                    <Link
                      to="/e-mail-bevestigen"
                      onClick={() => setCallback({ path: "/e-mail-bevestigen", query: "?error=resend" })}
                    >
                      {tr("auth.resend")}
                    </Link>
                    <Button variant="ghost" loading={signOutBusy} onClick={() => void signOut()}>
                      {tr("auth.signOut")}
                    </Button>
                  </>
                ) : path !== "/organisatie-kiezen" ? (
                  children
                ) : (
                  <>
                    {picker}
                    <Button variant="ghost" loading={signOutBusy} onClick={() => void signOut()}>
                      {tr("auth.signOut")}
                    </Button>
                  </>
                )}
              </>
            )}
          </section>
        </main>
      </AuthLayout>
    );
  }
}

function PageEffects({
  path,
  locale,
  heading,
}: {
  path: string;
  locale: Locale;
  heading: React.RefObject<HTMLHeadingElement | null>;
}) {
  const status = useRouterState({ select: (state) => state.status });
  useEffect(() => {
    document.title = `${t(locale, (knownTitles as Record<string, MessageKey>)[path] ?? "auth.home")} · ${t(locale, "app.name")}`;
    if (status === "idle") {
      const target = heading.current ?? document.querySelector<HTMLHeadingElement>("main h1");
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus();
      }
    }
  }, [path, locale, heading, status]);
  return null;
}
