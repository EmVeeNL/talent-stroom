import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALES, t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { Button, Dialog, Header, Select, ThemeToggle } from "@talentstroom/ui";
import { createTransport, errorKey, isAborted, listOrganizations, RequestError } from "./auth.ts";
import type { OrganizationList } from "./auth.ts";
import { AuthScreens, publicRoutes, titles } from "./AuthScreens.tsx";
import { OrganizationPicker } from "./OrganizationPicker.tsx";
import "./auth.css";

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
type Context =
  | { kind: "loading" }
  | { kind: "guest" }
  | { kind: "ready"; data: OrganizationList }
  | { kind: "error"; message: MessageKey };
const readLocation = () => ({ path: window.location.pathname, query: window.location.search });
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
        if (!signal.aborted) setContext({ kind: "ready", data });
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
    else if (active && (path === "/inloggen" || path === "/registreren" || !titles[path])) path = "/";
  }
  useEffect(() => {
    if (path !== location.path) {
      window.history.replaceState(null, "", path);
    }
  }, [path, location.path]);
  useEffect(() => {
    if (context.kind !== "loading") heading.current?.focus();
    document.title = `${t(locale, titles[path] ?? "auth.home")} · ${t(locale, "app.name")}`;
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
      if (url.origin !== window.location.origin || !titles[url.pathname]) return;
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
  const home = path === "/" && active;
  return (
    <div className={home ? "workspace" : "auth-shell"}>
      {home ? (
        <Header
          userMenu={
            <Button variant="ghost" loading={signOutBusy} onClick={() => void signOut()}>
              {tr("auth.signOut")}
            </Button>
          }
        >
          <strong>{tr("app.name")}</strong>
          <span>{active.name}</span>
          <Dialog title={tr("auth.picker")} triggerLabel={tr("auth.switchOrg")} closeLabel={tr("auth.close")}>
            {picker}
          </Dialog>
        </Header>
      ) : (
        <aside className="auth-brand">
          <a href="/inloggen" className="auth-wordmark">
            {tr("app.name")}
          </a>
          <div>
            <p className="auth-brand-title">{tr("auth.brandLine")}</p>
            <p>{tr("auth.brandText")}</p>
          </div>
        </aside>
      )}
      <div className={home ? "workspace-body" : "auth-panel"}>
        <div className="auth-controls">{controls}</div>
        <main className={home ? "workspace-content" : "auth-content"}>
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
              ) : home ? (
                <>
                  <p>
                    {tr("auth.active")}: <strong>{active.name}</strong>
                  </p>
                  <p>{tr("auth.homeIntro")}</p>
                </>
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
        </main>
      </div>
    </div>
  );
}
