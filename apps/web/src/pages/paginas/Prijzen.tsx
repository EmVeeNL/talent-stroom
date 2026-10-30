import { useState } from "react";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { Badge, Button } from "@talentstroom/ui";
import { PageFrame, Icon } from "./pageShared.tsx";
export default function PrijzenPage({ locale }: { locale: Locale }) {
  const [yearly, setYearly] = useState(false);
  const plans = [
    [
      "Starter",
      "Voor zelfstandige recruiters",
      yearly ? "€ 19" : "€ 24",
      ["Tot 2 gebruikers", "Kandidatenbeheer", "Eén actieve vacature"],
    ],
    [
      "Team",
      "Voor groeiende teams",
      yearly ? "€ 49" : "€ 59",
      ["Tot 5 gebruikers", "Onbeperkte vacatures", "Samenwerken in pipelines"],
    ],
    [
      "Bureau",
      "Voor bureaus met ambitie",
      yearly ? "€ 99" : "€ 119",
      ["Tot 15 gebruikers", "Geavanceerde rapportages", "Prioriteitsondersteuning"],
    ],
  ] as const;
  return (
    <PageFrame locale={locale} titleKey="nav.paginas.prijzen" subtitle={t(locale, "demo.pages.pricing.subtitle")}>
      <fieldset className="page-billing" aria-label={t(locale, "demo.pages.pricing.billing")}>
        <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>
          Maandelijks
        </button>
        <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>
          Jaarlijks <span>(2 maanden gratis)</span>
        </button>
      </fieldset>
      <div className="pages-grid">
        {plans.map(([name, desc, price, features], i) => (
          <section key={name} className={`page-panel page-plan ${i === 1 ? "page-plan--featured" : ""}`}>
            {i === 1 && (
              <Badge className="page-plan-badge" tone="info">
                Meest gekozen
              </Badge>
            )}
            <h2>{name}</h2>
            <p>{desc}</p>
            <div className="page-price">
              {price}
              <small> / maand</small>
            </div>
            <p className="page-muted">Excl. btw</p>
            <ul className="page-list">
              {features.map((x) => (
                <li key={x}>
                  <Icon>check_circle</Icon>
                  {x}
                </li>
              ))}
            </ul>
            <Button variant={i === 1 ? "primary" : "secondary"}>{t(locale, "demo.pages.pricing.choose")}</Button>
          </section>
        ))}
      </div>
      <section className="page-panel">
        <h2>{t(locale, "demo.pages.pricing.faq")}</h2>
        <p>{t(locale, "demo.pages.pricing.faqBody")}</p>
      </section>
    </PageFrame>
  );
}
