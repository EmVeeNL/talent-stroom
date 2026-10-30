import { useMemo, useState } from "react";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { PageFrame } from "./pageShared.tsx";
const questions = [
  ["Account", "Hoe maak ik een account aan?", "Kies Registreren en volg de stappen op het scherm."],
  [
    "Account",
    "Ik ben mijn wachtwoord vergeten. Wat nu?",
    "Vraag via Wachtwoord vergeten een beveiligde resetlink aan.",
  ],
  ["Facturatie", "Zijn de prijzen inclusief btw?", "Nee, alle genoemde prijzen zijn exclusief btw."],
  ["Facturatie", "Kan ik mijn abonnement wijzigen?", "Je kunt op elk moment een passend plan kiezen."],
  ["Privacy", "Hoe beschermen jullie kandidaatdata?", "Toegang is beperkt tot bevoegde leden van je organisatie."],
];
export default function VeelgesteldeVragenPage({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => questions.filter((x) => x.join(" ").toLocaleLowerCase(locale).includes(query.toLocaleLowerCase(locale))),
    [query, locale],
  );
  return (
    <PageFrame
      locale={locale}
      titleKey="nav.paginas.veelgestelde_vragen"
      subtitle={t(locale, "demo.pages.faq.subtitle")}
    >
      <label className="page-search">
        <span>{t(locale, "demo.pages.faq.search")}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(locale, "demo.pages.faq.placeholder")}
        />
      </label>
      {[...new Set(filtered.map((x) => x[0]))].map((group) => (
        <section key={group} className="page-stack">
          <h2>{group}</h2>
          {filtered
            .filter((x) => x[0] === group)
            .map(([, q, a]) => (
              <details className="page-accordion" key={q}>
                <summary aria-expanded="false">{q}</summary>
                <p>{a}</p>
              </details>
            ))}
        </section>
      ))}
      {!filtered.length && <p>{t(locale, "demo.pages.faq.noResults")}</p>}
    </PageFrame>
  );
}
