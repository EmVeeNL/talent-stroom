import { useState } from "react";
import type { FormEvent } from "react";
import { Button, TextField, Textarea } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { FormPage, FormSection } from "./components/FormPage.tsx";

export default function ValidatiePage({ locale }: { locale: Locale }) {
  const [errors, setErrors] = useState<string[]>([]),
    [saved, setSaved] = useState(false);
  const required = t(locale, "demo.forms.required"),
    invalidEmail = t(locale, "demo.forms.invalidEmail");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: string[] = [];
    const nameValue = data.get("name");
    if (!(typeof nameValue === "string" ? nameValue : "").trim()) next.push("name");
    const emailValue = data.get("email");
    const email = (typeof emailValue === "string" ? emailValue : "").trim();
    if (!email) next.push("email-required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.push("email-invalid");
    setErrors(next);
    setSaved(next.length === 0);
  }
  const nameError = errors.includes("name") ? required : undefined;
  const emailError = errors.includes("email-required")
    ? required
    : errors.includes("email-invalid")
      ? invalidEmail
      : undefined;
  return (
    <FormPage locale={locale} titleKey="nav.formulieren.validatie">
      <FormSection title={t(locale, "demo.forms.section.errors")}>
        <form className="demo-form-full demo-form-layout" noValidate onSubmit={submit}>
          {errors.length > 0 && (
            <div className="demo-form-summary" role="alert" aria-labelledby="demo-form-summary-title">
              <h2 id="demo-form-summary-title">{t(locale, "demo.forms.errorSummary")}</h2>
              <p>{t(locale, "demo.forms.fixErrors")}</p>
              <ul>
                {errors.includes("name") && (
                  <li>
                    <a href="#validation-name">
                      {t(locale, "demo.forms.name")}: {required}
                    </a>
                  </li>
                )}
                {(errors.includes("email-required") || errors.includes("email-invalid")) && (
                  <li>
                    <a href="#validation-email">
                      {t(locale, "demo.forms.email")}: {emailError}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
          {saved && <output>{t(locale, "demo.forms.saved")}</output>}
          <TextField
            id="validation-name"
            name="name"
            label={t(locale, "demo.forms.name")}
            required
            {...(nameError ? { error: nameError } : {})}
            hint={t(locale, "demo.forms.nameHint")}
          />
          <TextField
            id="validation-email"
            name="email"
            label={t(locale, "demo.forms.email")}
            type="email"
            required
            {...(emailError ? { error: emailError } : {})}
            hint={t(locale, "demo.forms.emailHint")}
          />
          <Textarea
            id="validation-description"
            label={t(locale, "demo.forms.description")}
            hint={t(locale, "demo.forms.description")}
            maxLength={240}
          />
          <Button type="submit" className="demo-form-wide">
            {t(locale, "demo.forms.save")}
          </Button>
        </form>
      </FormSection>
    </FormPage>
  );
}
