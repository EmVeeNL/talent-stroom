import { AuthScreens } from "../../pages/auth/AuthFlow.tsx";
import { OrganizationPicker } from "../../pages/auth/OrganizationPicker.tsx";
import { createTransport } from "../../auth.ts";
import type { OrganizationList } from "../../auth.ts";
import { Logo } from "@talentstroom/ui";
import { AuthHero } from "../../layouts/AuthHero.tsx";
import { t } from "@talentstroom/i18n";
import { useGallery } from "../context.ts";

const organizations: OrganizationList = {
  activeOrganizationId: null,
  organizations: [
    {
      organizationId: "11111111-1111-4111-8111-111111111111",
      membershipId: "22222222-2222-4222-8222-222222222222",
      name: "Noord Recruitment",
      slug: "noord-recruitment",
      role: "owner",
    },
    {
      organizationId: "33333333-3333-4333-8333-333333333333",
      membershipId: "44444444-4444-4444-8444-444444444444",
      name: "Talent Partners",
      slug: "talent-partners",
      role: "recruiter",
    },
    {
      organizationId: "55555555-5555-4555-8555-555555555555",
      membershipId: "66666666-6666-4666-8666-666666666666",
      name: "Werk & Co",
      slug: "werk-en-co",
      role: "viewer",
    },
  ],
};
const transport = createTransport();
transport.auth = async () => ({});
const states = [
  { id: "login", path: "/inloggen", query: "" },
  { id: "error", path: "/inloggen", query: "", error: true },
  { id: "register", path: "/registreren", query: "" },
  { id: "verify", path: "/e-mail-bevestigen", query: "" },
  { id: "reset", path: "/wachtwoord-herstellen", query: "?token=synthetic-token" },
] as const;

export function Auth() {
  const { locale } = useGallery();
  const tr = (key: Parameters<typeof t>[1]) => t(locale, key);
  return (
    <div className="gallery-auth">
      {states.map((state) => (
        <section className="gallery-auth-preview" key={state.id}>
          <h2>
            {state.id === "error"
              ? "Login · fout"
              : state.id === "verify"
                ? "E-mail bevestigen"
                : state.id === "reset"
                  ? "Wachtwoord herstellen"
                  : state.id === "register"
                    ? "Account aanmaken"
                    : "Inloggen"}
          </h2>
          <div className="auth-shell gallery-auth-shell">
            <aside className="auth-brand">
              <AuthHero />
              <a href="/inloggen" className="auth-wordmark" aria-label={tr("app.name")}>
                <Logo tone="dark" size="lg" />
              </a>
              <div className="auth-brand-copy">
                <h2 className="auth-brand-title">{tr("auth.brandLine")}</h2>
                <p>{tr("auth.brandText")}</p>
                <ul className="auth-benefits">
                  {(["auth.valueSpeed", "auth.valueShortlist", "auth.valuePipeline", "auth.valueShare"] as const).map(
                    (key) => (
                      <li key={key}>{tr(key)}</li>
                    ),
                  )}
                </ul>
              </div>
            </aside>
            <div className="auth-panel">
              <main className="auth-content">
                <section className="auth-card">
                  <Logo className="auth-card-logo" size="md" />
                  <h1>
                    {tr(
                      state.path === "/inloggen"
                        ? "auth.login"
                        : state.path === "/registreren"
                          ? "auth.register"
                          : state.path === "/e-mail-bevestigen"
                            ? "auth.verify"
                            : "auth.reset",
                    )}
                  </h1>
                  <AuthScreens
                    key={state.id}
                    path={state.path}
                    query={state.query}
                    locale={locale}
                    transport={transport}
                    onSignedIn={() => undefined}
                    previewError={"error" in state ? state.error : false}
                  />
                </section>
              </main>
            </div>
          </div>
        </section>
      ))}
      <section className="gallery-auth-preview">
        <h2>Kies je organisatie</h2>
        <div className="auth-shell gallery-auth-shell">
          <div className="auth-panel">
            <main className="auth-content">
              <section className="auth-card">
                <Logo className="auth-card-logo" size="md" />
                <h1>{tr("auth.picker")}</h1>
                <OrganizationPicker
                  data={organizations}
                  locale={locale}
                  transport={transport}
                  onChanged={() => undefined}
                  onExpired={() => undefined}
                />
              </section>
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}
