import { useState } from "react";
import { z } from "zod";
import { useAppForm, FormSummary, submitForm } from "../../forms.tsx";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { PageFrame, Icon } from "./pageShared.tsx";
const schema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  subject: z.string().min(1),
  message: z.string().min(10),
  privacy: z.boolean().refine(Boolean),
});
export default function ContactPage({ locale }: { locale: Locale }) {
  const [sent, setSent] = useState(false);
  const form = useAppForm({
    defaultValues: { name: "", email: "", subject: "", message: "", privacy: false },
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: ({ value }) => {
      schema.parse(value);
      setSent(true);
    },
  });
  return (
    <PageFrame locale={locale} titleKey="nav.paginas.contact" subtitle={t(locale, "demo.pages.contact.subtitle")}>
      <div className="pages-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))" }}>
        <section className="page-panel">
          <h2>{t(locale, "demo.pages.contact.formTitle")}</h2>
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
                fields={Object.fromEntries(
                  ["name", "email", "subject", "message", "privacy"].map((name) => [
                    name,
                    {
                      id: `contact-${name}`,
                      label: t(
                        locale,
                        name === "name"
                          ? "demo.pages.contact.name"
                          : name === "email"
                            ? "demo.pages.contact.email"
                            : name === "subject"
                              ? "demo.pages.contact.subject"
                              : name === "message"
                                ? "demo.pages.contact.message"
                                : "demo.pages.contact.privacy",
                      ),
                    },
                  ]),
                )}
              />
              <form.AppField name="name">
                {(field) => (
                  <field.Text
                    locale={locale}
                    id="contact-name"
                    label={t(locale, "demo.pages.contact.name")}
                    required
                    autoComplete="name"
                  />
                )}
              </form.AppField>
              <form.AppField name="email">
                {(field) => (
                  <field.Text
                    locale={locale}
                    id="contact-email"
                    label={t(locale, "demo.pages.contact.email")}
                    required
                    type="email"
                    autoComplete="email"
                  />
                )}
              </form.AppField>
              <form.AppField name="subject">
                {(field) => (
                  <field.Choice
                    locale={locale}
                    id="contact-subject"
                    label={t(locale, "demo.pages.contact.subject")}
                    required
                    placeholder={t(locale, "demo.pages.contact.select")}
                  >
                    <option value="general">{t(locale, "form.contact.general")}</option>
                    <option value="subscription">{t(locale, "form.contact.subscription")}</option>
                    <option value="support">{t(locale, "form.contact.support")}</option>
                  </field.Choice>
                )}
              </form.AppField>
              <form.AppField name="message">
                {(field) => (
                  <field.Area
                    locale={locale}
                    id="contact-message"
                    label={t(locale, "demo.pages.contact.message")}
                    required
                    minLength={10}
                  />
                )}
              </form.AppField>
              <form.AppField name="privacy">
                {(field) => (
                  <field.Check
                    locale={locale}
                    id="contact-privacy"
                    label={t(locale, "demo.pages.contact.privacy")}
                    required
                  />
                )}
              </form.AppField>
              <button type="submit">{t(locale, "demo.pages.contact.send")}</button>
              {sent && <output>{t(locale, "demo.pages.contact.toast")}</output>}
            </form>
          </form.AppForm>
        </section>
        <aside className="page-panel">
          <h2>{t(locale, "demo.pages.contact.office")}</h2>
          <p>
            <Icon>location_on</Icon> TalentStroom Demo
            <br />
            Stationsplein 10
            <br />
            3511 ED Utrecht
            <br />
            Nederland
          </p>
          <p>
            <Icon>mail</Icon> hallo@voorbeeld.nl
          </p>
          <p>
            <Icon>schedule</Icon> Maandag–vrijdag · 9.00–17.00
          </p>
        </aside>
      </div>
    </PageFrame>
  );
}
