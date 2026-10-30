import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button, Checkbox, Tabs, TextField } from "@talentstroom/ui";
import { DEFAULT_LOCALE, t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { errorKey, isAborted } from "../../auth.ts";
import type { Transport } from "../../auth.ts";

export const publicRoutes = [
  "/inloggen",
  "/registreren",
  "/e-mail-bevestigen",
  "/wachtwoord-vergeten",
  "/wachtwoord-herstellen",
];
export const titles: Record<string, MessageKey> = {
  "/inloggen": "auth.login",
  "/registreren": "auth.register",
  "/e-mail-bevestigen": "auth.verify",
  "/wachtwoord-vergeten": "auth.forgot",
  "/wachtwoord-herstellen": "auth.reset",
  "/organisatie-kiezen": "auth.picker",
  "/": "auth.home",
};
export function AuthScreens({
  path,
  query,
  locale,
  transport,
  onSignedIn,
  previewError = false,
}: {
  path: string;
  query: string;
  locale: Locale;
  transport: Transport;
  onSignedIn: () => void;
  previewError?: boolean;
}) {
  const tr = (key: MessageKey) => t(locale, key);
  const [busy, setBusy] = useState(() => path === "/e-mail-bevestigen" && new URLSearchParams(query).has("token"));
  const [error, setError] = useState<MessageKey | undefined>(() => (previewError ? "auth.loginError" : undefined));
  const [done, setDone] = useState<MessageKey>();
  const controller = useRef<AbortController | null>(null);
  const params = new URLSearchParams(query);
  const token = params.get("token");
  const invalid = params.has("error");
  const login = path === "/inloggen";
  const register = path === "/registreren";
  const verify = path === "/e-mail-bevestigen";
  const reset = path === "/wachtwoord-herstellen";
  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    return () => abort.abort();
  }, []);
  const verified = verify && !invalid && !token;
  useEffect(() => {
    if (!verify || !token) return undefined;
    const abort = new AbortController();
    void transport
      .auth(`verify-email?token=${encodeURIComponent(token)}`, undefined, DEFAULT_LOCALE, abort.signal)
      .then(() => setDone("auth.verified"))
      .catch((err: unknown) => {
        if (!isAborted(err)) setError("auth.invalidLink");
      })
      .finally(() => {
        if (!abort.signal.aborted) setBusy(false);
      });
    return () => abort.abort();
  }, [verify, token, transport]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const value = (key: string) => {
      const entry = form.get(key);
      return typeof entry === "string" ? entry : "";
    };
    setBusy(true);
    setError(undefined);
    const callbackURL = new URL("/e-mail-bevestigen", window.location.origin).href;
    try {
      const signal = controller.current?.signal;
      if (login) {
        const result = await transport.auth(
          "sign-in/email",
          { email: value("email"), password: value("password") },
          locale,
          signal,
        );
        if (result && typeof result === "object" && "twoFactorRedirect" in result && result.twoFactorRedirect) {
          setError("auth.loginError");
          return;
        }
        onSignedIn();
      } else if (register) {
        await transport.auth(
          "sign-up/email",
          { name: value("name"), email: value("email"), password: value("password"), callbackURL },
          locale,
          signal,
        );
        setDone("auth.mailSent");
      } else if (reset) {
        await transport.auth("reset-password", { token: token ?? "", newPassword: value("password") }, locale, signal);
        setDone("auth.resetDone");
      } else {
        await transport.auth(
          verify ? "send-verification-email" : "request-password-reset",
          {
            email: value("email"),
            ...(verify
              ? { callbackURL }
              : { redirectTo: new URL("/wachtwoord-herstellen", window.location.origin).href }),
          },
          locale,
          signal,
        );
        setDone("auth.mailSent");
      }
    } catch (err) {
      if (!isAborted(err)) setError(errorKey(err, login));
    } finally {
      if (!controller.current?.signal.aborted) setBusy(false);
    }
  }
  const invalidReset = reset && (invalid || !token);
  return (
    <>
      {login && <p className="auth-intro">{tr("auth.loginSubtitle")}</p>}
      {(done || verified) && <output>{tr(done ?? "auth.verified")}</output>}
      {(invalid || invalidReset) && <p role="alert">{tr("auth.invalidLink")}</p>}
      {error && <p role="alert">{tr(error)}</p>}
      {reset && error && <a href="/wachtwoord-vergeten">{tr("auth.newReset")}</a>}
      {invalidReset ? (
        <a href="/wachtwoord-vergeten">{tr("auth.newReset")}</a>
      ) : (
        !done && (
          <>
            {login && (
              <Tabs
                label={tr("auth.method")}
                selectedId="email"
                tabs={[
                  { id: "email", label: tr("auth.emailTab"), panel: null },
                  {
                    id: "passkey",
                    label: (
                      <>
                        <span>{tr("auth.passkeyTab")}</span>
                        <span className="auth-soon-badge">{tr("auth.comingSoon")}</span>
                      </>
                    ),
                    panel: null,
                    disabled: true,
                  },
                ]}
              />
            )}
            <form
              aria-label={tr(titles[path] ?? "auth.signIn")}
              onSubmit={(event) => void submit(event)}
              aria-busy={busy}
            >
              <fieldset disabled={busy} className="auth-fields">
                {register && (
                  <TextField
                    name="name"
                    label={tr("auth.name")}
                    placeholder={tr("auth.namePlaceholder")}
                    required
                    autoComplete="name"
                    maxLength={100}
                  />
                )}
                {!reset && (
                  <TextField
                    name="email"
                    label={tr("auth.email")}
                    placeholder={tr("auth.emailPlaceholder")}
                    type="email"
                    leadingIcon="mail"
                    required
                    autoComplete="email"
                  />
                )}
                {(login || register || reset) && (
                  <>
                    <TextField
                      name="password"
                      label={tr("auth.password")}
                      placeholder={tr("auth.passwordPlaceholder")}
                      type="password"
                      leadingIcon="lock"
                      visibilityLabels={{ show: tr("auth.show"), hide: tr("auth.hide") }}
                      required
                      minLength={login ? undefined : 12}
                      maxLength={128}
                      autoComplete={login ? "current-password" : "new-password"}
                      {...(!login ? { hint: tr("auth.passwordHint") } : {})}
                    />
                  </>
                )}
                {register && <Checkbox name="terms" required label={tr("auth.terms")} />}
                {login && (
                  <div className="auth-login-options">
                    <span aria-hidden="true" />
                    <a href="/wachtwoord-vergeten">{tr("auth.forgotLink")}</a>
                  </div>
                )}
                {verify && <p className="auth-intro">{tr("auth.verificationHelp")}</p>}
                <Button
                  type="submit"
                  loading={busy}
                  loadingLabel={tr("auth.loading")}
                  {...(login ? { trailingIcon: "arrow_forward", className: "auth-submit" } : {})}
                >
                  {tr(
                    login
                      ? "auth.signIn"
                      : register
                        ? "auth.createAccount"
                        : reset
                          ? "auth.savePassword"
                          : verify
                            ? "auth.resend"
                            : "auth.sendReset",
                  )}
                </Button>
              </fieldset>
            </form>
          </>
        )
      )}
      <nav className="auth-links">
        {login ? (
          <p>
            {tr("auth.newAccount")} <a href="/registreren">{tr("auth.signUp")}</a>
          </p>
        ) : (
          <a href="/inloggen">{tr(verified || done ? "auth.signIn" : "auth.back")}</a>
        )}
      </nav>
    </>
  );
}
