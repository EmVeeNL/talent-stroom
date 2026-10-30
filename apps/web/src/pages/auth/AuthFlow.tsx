import { useDataLayer } from "../../QueryProvider.tsx";
import { Link } from "../../Link.tsx";
import { useEffect, useRef, useState } from "react";
import { SignInRequest, SignUpRequest, AuthEmailRequest, NewPasswordRequest } from "@talentstroom/contracts";
import { z } from "zod";
import { useAppForm, FormSummary, submitForm } from "../../forms.tsx";
import { Button, Tabs } from "@talentstroom/ui";
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
  const layer = useDataLayer();
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

  const requestSchema = login
    ? SignInRequest
    : register
      ? SignUpRequest
      : reset
        ? NewPasswordRequest
        : AuthEmailRequest;
  const schema = z.object({
    name: register ? SignUpRequest.shape.name : z.string(),
    email: !reset ? AuthEmailRequest.shape.email : z.string(),
    password: login ? SignInRequest.shape.password : register || reset ? NewPasswordRequest.shape.password : z.string(),
    terms: z.boolean().refine((accepted) => !register || accepted),
  });
  const form = useAppForm({
    defaultValues: { name: "", email: "", password: "", terms: false },
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: async ({ value }) => submit(requestSchema.parse(value)),
  });
  async function submit(values: { name?: string; email?: string; password?: string }) {
    if (busy) return;
    const value = (key: "name" | "email" | "password") => values[key] ?? "";
    setBusy(true);
    setError(undefined);
    const callbackURL = new URL("/e-mail-bevestigen", window.location.origin).href;
    try {
      const signal = controller.current?.signal;
      const send: Transport["auth"] = (endpoint, body, language, requestSignal) =>
        layer
          ? layer.authSubmit(transport, endpoint, body, language, requestSignal)
          : transport.auth(endpoint, body, language, requestSignal);
      if (login) {
        const signIn = () =>
          transport.auth("sign-in/email", { email: value("email"), password: value("password") }, locale, signal);
        const result = layer
          ? await layer.signIn(transport, { email: value("email"), password: value("password") }, locale, signal)
          : await signIn();
        if (result && typeof result === "object" && "twoFactorRedirect" in result && result.twoFactorRedirect) {
          setError("auth.loginError");
          return;
        }
        onSignedIn();
      } else if (register) {
        await send(
          "sign-up/email",
          { name: value("name"), email: value("email"), password: value("password"), callbackURL },
          locale,
          signal,
        );
        setDone("auth.mailSent");
      } else if (reset) {
        await send("reset-password", { token: token ?? "", newPassword: value("password") }, locale, signal);
        setDone("auth.resetDone");
      } else {
        await send(
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
      {reset && error && <Link to="/wachtwoord-vergeten">{tr("auth.newReset")}</Link>}
      {invalidReset ? (
        <Link to="/wachtwoord-vergeten">{tr("auth.newReset")}</Link>
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
            <form.AppForm>
              <form
                noValidate
                aria-label={tr(titles[path] ?? "auth.signIn")}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!busy) void submitForm(form);
                }}
                aria-busy={busy}
              >
                <FormSummary
                  locale={locale}
                  fields={{
                    ...(register
                      ? {
                          name: { id: "auth-name", label: tr("auth.name") },
                          terms: { id: "auth-terms", label: tr("auth.terms") },
                        }
                      : {}),
                    ...(!reset ? { email: { id: "auth-email", label: tr("auth.email") } } : {}),
                    ...(login || register || reset
                      ? { password: { id: "auth-password", label: tr("auth.password") } }
                      : {}),
                  }}
                />
                <fieldset disabled={busy} className="auth-fields">
                  {register && (
                    <form.AppField name="name">
                      {(field) => (
                        <field.Text
                          id="auth-name"
                          locale={locale}
                          label={tr("auth.name")}
                          placeholder={tr("auth.namePlaceholder")}
                          required
                          autoComplete="name"
                          maxLength={100}
                        />
                      )}
                    </form.AppField>
                  )}
                  {!reset && (
                    <form.AppField name="email">
                      {(field) => (
                        <field.Text
                          id="auth-email"
                          locale={locale}
                          label={tr("auth.email")}
                          placeholder={tr("auth.emailPlaceholder")}
                          type="email"
                          leadingIcon="mail"
                          required
                          autoComplete="email"
                        />
                      )}
                    </form.AppField>
                  )}
                  {(login || register || reset) && (
                    <>
                      <form.AppField name="password">
                        {(field) => (
                          <field.Text
                            id="auth-password"
                            locale={locale}
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
                        )}
                      </form.AppField>
                    </>
                  )}
                  {register && (
                    <form.AppField name="terms">
                      {(field) => <field.Check id="auth-terms" locale={locale} required label={tr("auth.terms")} />}
                    </form.AppField>
                  )}
                  {login && (
                    <div className="auth-login-options">
                      <span aria-hidden="true" />
                      <Link to="/wachtwoord-vergeten">{tr("auth.forgotLink")}</Link>
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
            </form.AppForm>
          </>
        )
      )}
      <nav className="auth-links">
        {login ? (
          <p>
            {tr("auth.newAccount")} <Link to="/registreren">{tr("auth.signUp")}</Link>
          </p>
        ) : (
          <Link to="/inloggen">{tr(verified || done ? "auth.signIn" : "auth.back")}</Link>
        )}
      </nav>
    </>
  );
}
