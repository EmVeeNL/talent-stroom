import { useState } from "react";
import { Button, Textarea } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { FormPage, FormSection } from "./components/FormPage.tsx";

export default function EditorsPage({ locale }: { locale: Locale }) {
  const [value, setValue] = useState("De kandidaat werkt graag in een klein team.");
  const insert = (marker: string) => setValue((current) => `${current}${current ? " " : ""}${marker}`);
  return (
    <FormPage locale={locale} titleKey="nav.formulieren.editors">
      <FormSection title={t(locale, "demo.forms.section.richText")}>
        <div className="demo-form-full">
          <div className="demo-form-toolbar" role="toolbar" aria-label={t(locale, "demo.forms.section.richText")}>
            <Button
              type="button"
              variant="secondary"
              aria-label={t(locale, "demo.forms.toolbar.bold")}
              onClick={() => insert("**tekst**")}
            >
              B
            </Button>
            <Button
              type="button"
              variant="secondary"
              aria-label={t(locale, "demo.forms.toolbar.italic")}
              onClick={() => insert("_tekst_")}
            >
              <i>I</i>
            </Button>
            <Button
              type="button"
              variant="secondary"
              aria-label={t(locale, "demo.forms.toolbar.bullets")}
              onClick={() => insert("\n- punt")}
            >
              •
            </Button>
            <Button
              type="button"
              variant="secondary"
              aria-label={t(locale, "demo.forms.toolbar.link")}
              onClick={() => insert("[link](https://voorbeeld.nl)")}
            >
              ↗
            </Button>
          </div>
          <Textarea
            label={t(locale, "demo.forms.note")}
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            maxLength={500}
          />
          <div className="demo-form-layout demo-form-layout--grid">
            <div>
              <h3>{t(locale, "demo.forms.section.richText")}</h3>
              <pre className="demo-form-copy" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                {value}
              </pre>
            </div>
            <div>
              <h3>{t(locale, "demo.forms.description")}</h3>
              <p className="demo-form-copy">{value.replaceAll(/[*_()[\]]/g, "")}</p>
            </div>
          </div>
        </div>
      </FormSection>
    </FormPage>
  );
}
