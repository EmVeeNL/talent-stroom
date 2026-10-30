import { useState } from "react";
import { Checkbox, RadioGroup, Select, Switch, Textarea, TextField } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { FormPage, FormSection } from "./components/FormPage.tsx";

export default function BasisPage({ locale }: { locale: Locale }) {
  const [hybrid, setHybrid] = useState(true);
  return (
    <FormPage locale={locale} titleKey="nav.formulieren.basis">
      <FormSection title={t(locale, "demo.forms.section.text")}>
        <TextField
          label={t(locale, "demo.forms.name")}
          hint={t(locale, "demo.forms.nameHint")}
          placeholder={t(locale, "demo.forms.name")}
        />
        <TextField
          label={t(locale, "demo.forms.email")}
          type="email"
          hint={t(locale, "demo.forms.emailHint")}
          placeholder="naam@voorbeeld.nl"
        />
        <Select label={t(locale, "demo.forms.role")} placeholder={t(locale, "demo.forms.selectRole")} defaultValue="">
          <option value="ontwikkelaar">Frontend developer</option>
          <option value="designer">Product designer</option>
          <option value="recruiter">Recruiter</option>
        </Select>
        <Textarea label={t(locale, "demo.forms.note")} maxLength={300} placeholder={t(locale, "demo.forms.note")} />
      </FormSection>
      <FormSection title={t(locale, "demo.forms.section.selection")}>
        <Checkbox label={t(locale, "demo.forms.pension")} defaultChecked />
        <Checkbox label={t(locale, "demo.forms.travel")} />
        <RadioGroup
          label={t(locale, "demo.forms.contract")}
          value="permanent"
          options={[
            { value: "permanent", label: t(locale, "demo.forms.permanent") },
            { value: "temporary", label: t(locale, "demo.forms.temporary") },
          ]}
        />
        <Switch label={t(locale, "demo.forms.hybrid")} checked={hybrid} onChange={setHybrid} />
      </FormSection>
    </FormPage>
  );
}
