import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALES, t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { Button, Icon, Logo, Select, ThemeToggle } from "@talentstroom/ui";
import { createTransport, errorKey, isAborted, listOrganizations, RequestError } from "./auth.ts";
import type { OrganizationList } from "./auth.ts";
import { AuthScreens, publicRoutes, titles } from "./AuthScreens.tsx";
import { OrganizationPicker } from "./OrganizationPicker.tsx";
import { Workspace } from "./Workspace.tsx";
import type { SessionUser } from "./Workspace.tsx";
import { AuthLayout } from "./layouts/AuthLayout.tsx";
import { authRouteTitles, findRoute, knownTitles, routes } from "./routes.ts";
import { Skeleton } from "@talentstroom/ui";
import "./auth.css";

// Dev-only component showcase: ?gallery. Tree-shaken from production builds.
const ComponentGallery = import.meta.env.DEV
  ? lazy(() => import("./gallery/Gallery.tsx").then((m) => ({ default: m.Gallery })))
  : null;
const LazyPages = new Map(routes.map((route) => [route.path, lazy(route.load)]));
const LazyNotFound = lazy(() => import("./pages/errors/NotFound.tsx"));
function RouteView({ path, locale }: { path: string; locale: Locale }) {
  const Page = LazyPages.get(path);
  return Page ? React.createElement(Page, { locale }) : null;
}

export function App() {
  if (ComponentGallery && new URLSearchParams(window.location.search).has("gallery")) {
    return (
      <Suspense fallback={null}>
        <ComponentGallery />
      </Suspense>
    );
  }
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("preview") === "dashboard") {
    return <DashboardPreview />;
  }
  return <AuthApp />;
}

function DashboardPreview() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [path, setPath] = useState(window.location.pathname);
  const transport = useState(createTransport)[0];
  const orgId = "11111111-1111-4111-8111-111111111111";
  const data: OrganizationList = {
    organizations: [
      {
        organizationId: orgId,
        membershipId: "22222222-2222-4222-8222-222222222222",
        name: "TalentStroom Demo",
        slug: "talentstroom-demo",
        role: "owner",
      },
    ],
    activeOrganizationId: orgId,
  };
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("popstate", update);
    const theme = new URLSearchParams(window.location.search).get("theme");
    if (theme === "light" || theme === "dark") document.documentElement.dataset["theme"] = theme;
    return () => window.removeEventListener("popstate", update);
  }, []);
  const route = findRoute(path);
  const Page = route ? LazyPages.get(route.path) : undefined;
  return (
    <Workspace
      locale={locale}
      onLocaleChange={setLocale}
      transport={transport}
      data={data}
      user={{ name: "Michael de Vries", email: "michael@example.test" }}
      signOutBusy={false}
      onSignOut={() => undefined}
      onChanged={() => undefined}
      onExpired={() => undefined}
      headingRef={{ current: null }}
      currentPath={path}
    >
      <Suspense fallback={<Skeleton variant="card" lines={3} />}>
        {Page ? React.createElement(Page, { locale }) : <LazyNotFound locale={locale} />}
      </Suspense>
    </Workspace>
  );
}
type Context =
  | { kind: "loading" }
  | { kind: "guest" }
  | { kind: "ready"; data: OrganizationList; user: SessionUser }
  | { kind: "error"; message: MessageKey };
const readLocation = () => ({ path: window.location.pathname, query: window.location.search });
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
  const [location, setLocation] = useState(readLocation);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [transport, setTransport] = useState(createTransport);
  const [context, setContext] = useState<Context>({ kind: "loading" });
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [actionError, setActionError] = useState<MessageKey>();
  const heading = useRef<HTMLHeadingElement>(null);
  const tr = (key: MessageKey) => t(locale, key);
  function navigate(path: string, replace = false) {
    if (replace) window.history.replaceState(null, "", path);
    else window.history.pushState(null, "", path);
    setLocation(readLocation());
    setActionError(undefined);
  }
  useEffect(() => {
    const update = () => {
      setLocation(readLocation());
      setActionError(undefined);
    };
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  // Capture callback parameters in memory, then remove secrets from the current history entry.
  useEffect(() => {
    const params = new URLSearchParams(location.query);
    if (params.has("token") || params.has("error")) window.history.replaceState(null, "", location.path);
  }, [location]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => {
    const signal = transport.signal;
    async function load() {
      try {
        const session = await transport.auth("get-session", undefined, DEFAULT_LOCALE, signal);
        if (signal.aborted) return;
        if (!session || typeof session !== "object" || !("user" in session)) {
          setContext({ kind: "guest" });
          return;
        }
        const data = await listOrganizations(transport, signal);
        if (!signal.aborted) setContext({ kind: "ready", data, user: readUser(session) });
      } catch (err) {
        if (isAborted(err) || signal.aborted) return;
        setContext(
          err instanceof RequestError && err.status === 401
            ? { kind: "guest" }
            : { kind: "error", message: errorKey(err) },
        );
      }
    }
    void load();
    return () => transport.cancel();
  }, [transport]);

  const active =
    context.kind === "ready"
      ? context.data.organizations.find((org) => org.organizationId === context.data.activeOrganizationId)
      : undefined;
  let path = location.path;
  if (context.kind === "guest" && !publicRoutes.includes(path)) path = "/inloggen";
  if (context.kind === "ready") {
    if (!active && !["/e-mail-bevestigen", "/wachtwoord-herstellen", "/wachtwoord-vergeten"].includes(path))
      path = "/organisatie-kiezen";
    else if (active && (path === "/inloggen" || path === "/registreren")) path = "/";
  }
  useEffect(() => {
    if (path !== location.path) {
      window.history.replaceState(null, "", path);
    }
  }, [path, location.path]);
  useEffect(() => {
    if (context.kind !== "loading") heading.current?.focus();
    document.title = `${t(locale, knownTitles[path] ?? "auth.home")} · ${t(locale, "app.name")}`;
  }, [path, context.kind, locale]);

  function refresh() {
    transport.cancel();
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
  useEffect(() => {
    function followLink(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        link.target ||
        link.hasAttribute("download")
      )
        return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin || !knownTitles[url.pathname]) return;
      event.preventDefault();
      window.history.pushState(null, "", url.pathname + url.search);
      setLocation(readLocation());
      setActionError(undefined);
    }
    document.addEventListener("click", followLink);
    return () => document.removeEventListener("click", followLink);
  }, []);
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
  const currentRoute = findRoute(path);
  if (active && context.kind === "ready" && currentRoute) {
    const route = currentRoute;
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
        {actionError && (
          <p role="alert" className="workspace-alert">
            {tr(actionError)}
          </p>
        )}
        <Suspense fallback={<Skeleton variant="card" lines={3} />}>
          <RouteView path={route.path} locale={locale} />
        </Suspense>
      </Workspace>
    );
  }
  if (active && context.kind === "ready" && !authRouteTitles[path]) {
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
        <Suspense fallback={<Skeleton variant="card" lines={3} />}>
          <LazyNotFound locale={locale} />
        </Suspense>
      </Workspace>
    );
  }
  return (
    <AuthLayout
      controls={controls}
      hero={
        <>
          <a href="/inloggen" className="auth-wordmark" aria-label={tr("app.name")}>
            <Logo tone="dark" size="lg" />
          </a>
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
      <main className="auth-content">
        <section className="auth-card">
          <Logo className="auth-card-logo" size="md" />
          {context.kind === "loading" ? (
            <output>{tr("auth.loading")}</output>
          ) : (
            <>
              <h1 ref={heading} tabIndex={-1}>
                {tr(context.kind === "error" ? "auth.sessionError" : (titles[path] ?? "auth.home"))}
              </h1>
              {actionError && <p role="alert">{tr(actionError)}</p>}
              {context.kind === "error" ? (
                <>
                  <p role="alert">{tr(context.message)}</p>
                  <Button onClick={refresh}>{tr("auth.retry")}</Button>
                  <a href="/e-mail-bevestigen?error=resend">{tr("auth.resend")}</a>
                  <Button variant="ghost" loading={signOutBusy} onClick={() => void signOut()}>
                    {tr("auth.signOut")}
                  </Button>
                </>
              ) : publicRoutes.includes(path) ? (
                <AuthScreens
                  key={location.path + location.query}
                  path={path}
                  query={location.query}
                  locale={locale}
                  transport={transport}
                  onSignedIn={refresh}
                />
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
