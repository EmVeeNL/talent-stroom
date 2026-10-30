import { useState } from "react";
import { z } from "zod";
import { Button } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { useAppForm, FormSummary, submitForm } from "../../forms.tsx";
import { FormPage, FormSection } from "./components/FormPage.tsx";

const schema = z.object({ name: z.string().trim().min(1), email: z.email(), description: z.string().max(240) });
export default function ValidatiePage({ locale }: { locale: Locale }) {
  const [saved, setSaved] = useState(false);
  const form = useAppForm({
    defaultValues: { name: "", email: "", description: "" },
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: ({ value }) => {
      schema.parse(value);
      setSaved(true);
    },
  });
  return (
    <FormPage locale={locale} titleKey="nav.formulieren.validatie">
      <FormSection title={t(locale, "demo.forms.section.errors")}>
        <form.AppForm>
          <form
            className="demo-form-full demo-form-layout"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void submitForm(form);
            }}
          >
            <FormSummary
              locale={locale}
              fields={{
                name: { id: "validation-name", label: t(locale, "demo.forms.name") },
                email: { id: "validation-email", label: t(locale, "demo.forms.email") },
                description: { id: "validation-description", label: t(locale, "demo.forms.description") },
              }}
            />
            {saved && <output>{t(locale, "demo.forms.saved")}</output>}
            <form.AppField name="name">
              {(field) => (
                <field.Text
                  locale={locale}
                  id="validation-name"
                  label={t(locale, "demo.forms.name")}
                  required
                  hint={t(locale, "demo.forms.nameHint")}
                />
              )}
            </form.AppField>
            <form.AppField name="email">
              {(field) => (
                <field.Text
                  locale={locale}
                  id="validation-email"
                  label={t(locale, "demo.forms.email")}
                  required
                  type="email"
                  hint={t(locale, "demo.forms.emailHint")}
                />
              )}
            </form.AppField>
            <form.AppField name="description">
              {(field) => (
                <field.Area
                  locale={locale}
                  id="validation-description"
                  label={t(locale, "demo.forms.description")}
                  hint={t(locale, "demo.forms.description")}
                  maxLength={240}
                />
              )}
            </form.AppField>
            <Button type="submit" className="demo-form-wide">
              {t(locale, "demo.forms.save")}
            </Button>
          </form>
        </form.AppForm>
      </FormSection>
    </FormPage>
  );
}
