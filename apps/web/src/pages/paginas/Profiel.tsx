import { useState } from "react";
import { Avatar, Checkbox } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { PageFrame } from "./pageShared.tsx";
export default function ProfielPage({ locale }: { locale: Locale }) {
  const [tab, setTab] = useState("overview");
  return (
    <PageFrame locale={locale} titleKey="nav.paginas.profiel" subtitle={t(locale, "demo.pages.profile.subtitle")}>
      <div className="page-profile-cover" />
      <div className="page-panel page-profile-head">
        <Avatar name="Sanne de Vries" size="lg" />
        <div>
          <h2>Sanne de Vries</h2>
          <p className="page-muted">Recruitment consultant · TalentStroom</p>
        </div>
      </div>
      <nav className="page-tabs" aria-label={t(locale, "demo.pages.profile.tabs")}>
        {[
          ["overview", "Overzicht"],
          ["activity", "Activiteit"],
          ["settings", "Instellingen"],
        ].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id ?? "overview")}>
            {label}
          </button>
        ))}
      </nav>
      <div className="page-stack" role="tabpanel">
        {tab === "settings" ? (
          <section className="page-panel">
            <h2>Profielinstellingen</h2>
            <form className="page-form">
              <label>
                Naam
                <input defaultValue="Sanne de Vries" />
              </label>
              <label>
                E-mailadres
                <input type="email" defaultValue="sanne@voorbeeld.nl" />
              </label>
              <label>
                Functie
                <input defaultValue="Recruitment consultant" />
              </label>
              <Checkbox label="E-mailmeldingen ontvangen" defaultChecked />
            </form>
          </section>
        ) : tab === "activity" ? (
          <section className="page-panel">
            <h2>Recente activiteit</h2>
            <p>Vandaag · Profiel bijgewerkt</p>
            <p>Gisteren · Kandidaat toegevoegd</p>
            <p>28 oktober · Vacature aangemaakt</p>
          </section>
        ) : (
          <>
            <section className="page-panel">
              <h2>Over mij</h2>
              <p>Ik help teams groeien met persoonlijke aandacht en een heldere aanpak.</p>
            </section>
            <section className="page-panel">
              <h2>Contactgegevens</h2>
              <p>sanne@voorbeeld.nl · 06-12345678 · Utrecht</p>
            </section>
          </>
        )}
      </div>
    </PageFrame>
  );
}
