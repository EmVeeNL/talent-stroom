import { TextField } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { FormPage, FormSection } from "./components/FormPage.tsx";

function InputGroup({
  locale,
  label,
  value,
  part,
}: {
  locale: Locale;
  label: string;
  value: string;
  part: "prefix" | "suffix";
}) {
  const addon = t(locale, part === "prefix" ? "demo.forms.prefix" : "demo.forms.suffix");
  return (
    <div className="demo-form-group">
      <label htmlFor={`field-${part}`} className="ts-field__label">
        {label}
      </label>
      <div className="demo-form-input-group" data-part={part}>
        <span>{addon}</span>
        <input id={`field-${part}`} className="ts-field__input" defaultValue={value} />
      </div>
    </div>
  );
}
export default function GroepenPage({ locale }: { locale: Locale }) {
  return (
    <FormPage locale={locale} titleKey="nav.formulieren.groepen">
      <FormSection title={t(locale, "demo.forms.section.group")}>
        <div className="demo-form-full demo-form-layout demo-form-layout--grid">
          <InputGroup locale={locale} label={t(locale, "demo.forms.salary")} value="4.500" part="prefix" />
          <InputGroup locale={locale} label={t(locale, "demo.forms.website")} value="talentstroom.nl" part="suffix" />
        </div>
        <fieldset className="demo-form-full demo-form-fieldset">
          <legend>{t(locale, "demo.forms.section.group")}</legend>
          <div className="demo-form-layout demo-form-layout--grid">
            <TextField label={t(locale, "demo.forms.name")} defaultValue="Lotte de Vries" />
            <TextField label={t(locale, "demo.forms.email")} type="email" defaultValue="lotte@voorbeeld.nl" />
          </div>
        </fieldset>
      </FormSection>
    </FormPage>
  );
}
