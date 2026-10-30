import { useState } from "react";
import { z } from "zod";
import { useAppForm, FormSummary, submitForm } from "../../forms.tsx";
import { Avatar } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { PageFrame } from "./pageShared.tsx";
const schema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  job: z.string().trim().min(1),
  notifications: z.boolean(),
});
export default function ProfielPage({ locale }: { locale: Locale }) {
  const [tab, setTab] = useState("overview");
  const [saved, setSaved] = useState(false);
  const form = useAppForm({
    defaultValues: {
      name: "Sanne de Vries",
      email: "sanne@voorbeeld.nl",
      job: "Recruitment consultant",
      notifications: true,
    },
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: ({ value }) => {
      schema.parse(value);
      setSaved(true);
    },
  });
  return (
    <PageFrame locale={locale} titleKey="nav.paginas.profiel" subtitle={t(locale, "demo.pages.profile.subtitle")}>
      <div className="page-profile-cover" />
      <div className="page-panel page-profile-head">
        <Avatar name="Sanne de Vries" size="lg" />
        <div>
          <h2>Sanne de Vries</h2>
          <p className="page-muted">Recruitment consultant · TalentStroom</p>
        </div>
      </div>
      <nav className="page-tabs" aria-label={t(locale, "demo.pages.profile.tabs")}>
        {[
          ["overview", "Overzicht"],
          ["activity", "Activiteit"],
          ["settings", "Instellingen"],
        ].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id ?? "overview")}>
            {label}
          </button>
        ))}
      </nav>
      <div className="page-stack" role="tabpanel">
        {tab === "settings" ? (
          <section className="page-panel">
            <h2>Profielinstellingen</h2>
            <form.AppForm>
              <form
                className="page-form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitForm(form);
                }}
              >
                <FormSummary
                  locale={locale}
                  fields={{
                    name: { id: "profile-name", label: t(locale, "auth.name") },
                    email: { id: "profile-email", label: t(locale, "auth.email") },
                    job: { id: "profile-job", label: t(locale, "form.profile.job") },
                  }}
                />
                <form.AppField name="name">
                  {(field) => (
                    <field.Text
                      locale={locale}
                      id="profile-name"
                      label={t(locale, "auth.name")}
                      autoComplete="name"
                      required
                    />
                  )}
                </form.AppField>
                <form.AppField name="email">
                  {(field) => (
                    <field.Text
                      locale={locale}
                      id="profile-email"
                      label={t(locale, "auth.email")}
                      type="email"
                      autoComplete="email"
                      required
                    />
                  )}
                </form.AppField>
                <form.AppField name="job">
                  {(field) => (
                    <field.Text locale={locale} id="profile-job" label={t(locale, "form.profile.job")} required />
                  )}
                </form.AppField>
                <form.AppField name="notifications">
                  {(field) => (
                    <field.Check
                      locale={locale}
                      id="profile-notifications"
                      label={t(locale, "form.profile.notifications")}
                    />
                  )}
                </form.AppField>
                <button type="submit">{t(locale, "demo.forms.save")}</button>
                {saved && <output>{t(locale, "demo.forms.saved")}</output>}
              </form>
            </form.AppForm>
          </section>
        ) : tab === "activity" ? (
          <section className="page-panel">
            <h2>Recente activiteit</h2>
            <p>Vandaag · Profiel bijgewerkt</p>
            <p>Gisteren · Kandidaat toegevoegd</p>
            <p>28 oktober · Vacature aangemaakt</p>
          </section>
        ) : (
          <>
            <section className="page-panel">
              <h2>Over mij</h2>
              <p>Ik help teams groeien met persoonlijke aandacht en een heldere aanpak.</p>
            </section>
            <section className="page-panel">
              <h2>Contactgegevens</h2>
              <p>sanne@voorbeeld.nl · 06-12345678 · Utrecht</p>
            </section>
          </>
        )}
      </div>
    </PageFrame>
  );
}
