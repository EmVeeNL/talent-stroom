import { Checkbox, Select, TextField, Textarea, Button } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { FormPage, FormSection } from "./components/FormPage.tsx";

function Fields({ locale }: { locale: Locale }) {
  return (
    <>
      <TextField label={t(locale, "demo.forms.name")} defaultValue="Sanne Willems" />
      <TextField label={t(locale, "demo.forms.email")} type="email" defaultValue="sanne@voorbeeld.nl" />
      <Select label={t(locale, "demo.forms.role")} defaultValue="engineer">
        <option value="engineer">Software engineer</option>
        <option value="designer">Product designer</option>
      </Select>
      <Textarea label={t(locale, "demo.forms.description")} defaultValue="Ervaring met toegankelijke webapplicaties." />
    </>
  );
}
export default function LayoutPage({ locale }: { locale: Locale }) {
  return (
    <FormPage locale={locale} titleKey="nav.formulieren.layout">
      <FormSection title={t(locale, "demo.forms.section.layout")}>
        <div className="demo-form-full demo-form-layout">
          <h3>{t(locale, "demo.forms.layout.vertical")}</h3>
          <div className="demo-form-layout">
            <Fields locale={locale} />
            <Checkbox label={t(locale, "demo.forms.benefits")} defaultChecked />
            <Button type="button">{t(locale, "demo.forms.save")}</Button>
          </div>
        </div>
        <div className="demo-form-full demo-form-layout">
          <h3>{t(locale, "demo.forms.layout.horizontal")}</h3>
          <div className="demo-form-layout demo-form-layout--horizontal">
            <strong>{t(locale, "demo.forms.name")}</strong>
            <TextField label={t(locale, "demo.forms.name")} defaultValue="Sanne Willems" />
            <strong>{t(locale, "demo.forms.email")}</strong>
            <TextField label={t(locale, "demo.forms.email")} type="email" defaultValue="sanne@voorbeeld.nl" />
          </div>
        </div>
        <div className="demo-form-full demo-form-layout">
          <h3>{t(locale, "demo.forms.layout.grid")}</h3>
          <div className="demo-form-layout demo-form-layout--grid">
            <Fields locale={locale} />
          </div>
        </div>
      </FormSection>
    </FormPage>
  );
}
