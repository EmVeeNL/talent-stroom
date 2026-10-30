import { useState } from "react";
import { Checkbox } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { PageFrame, Icon } from "./pageShared.tsx";
export default function ContactPage({ locale }: { locale: Locale }) {
  const [sent, setSent] = useState(false);
  return (
    <PageFrame locale={locale} titleKey="nav.paginas.contact" subtitle={t(locale, "demo.pages.contact.subtitle")}>
      <div className="pages-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))" }}>
        <section className="page-panel">
          <h2>{t(locale, "demo.pages.contact.formTitle")}</h2>
          <form
            className="page-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (e.currentTarget.reportValidity()) setSent(true);
            }}
          >
            <label>
              {t(locale, "demo.pages.contact.name")}
              <input required autoComplete="name" />
            </label>
            <label>
              {t(locale, "demo.pages.contact.email")}
              <input type="email" required autoComplete="email" />
            </label>
            <label>
              {t(locale, "demo.pages.contact.subject")}
              <select required defaultValue="">
                <option value="" disabled>
                  {t(locale, "demo.pages.contact.select")}
                </option>
                <option>Algemene vraag</option>
                <option>Abonnement</option>
                <option>Ondersteuning</option>
              </select>
            </label>
            <label>
              {t(locale, "demo.pages.contact.message")}
              <textarea required minLength={10} />
            </label>
            <Checkbox label={t(locale, "demo.pages.contact.privacy")} required />
            <button type="submit">{t(locale, "demo.pages.contact.send")}</button>
            {sent && <output>{t(locale, "demo.pages.contact.toast")}</output>}
          </form>
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
