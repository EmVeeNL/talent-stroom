import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { PageFrame, Icon, Link } from "./pageShared.tsx";
const cards = [
  ["login", "login", "Inloggen", "Open het aanmeldscherm"],
  ["register", "person_add", "Registreren", "Maak een nieuw account aan"],
  ["forgot", "lock_reset", "Wachtwoord vergeten", "Vraag een resetlink aan"],
  ["reset", "key", "Wachtwoord herstellen", "Stel een nieuw wachtwoord in"],
  ["verify", "mark_email_read", "E-mail bevestigen", "Rond je e-mailverificatie af"],
  ["picker", "business", "Kies je organisatie", "Selecteer je werkruimte"],
  ["tweestaps", "passkey", "Tweestaps", "Voorbeeld van extra verificatie"],
  ["vergrendeld", "lock", "Vergrendeld", "Voorbeeld van een vergrendelde sessie"],
  ["uitgelogd", "logout", "Uitgelogd", "Bevestiging na afmelden"],
  ["gelukt", "check_circle", "Gelukt", "Bevestiging van een afgeronde stap"],
] as const;
const paths = [
  "/inloggen",
  "/registreren",
  "/wachtwoord-vergeten",
  "/wachtwoord-herstellen",
  "/e-mail-bevestigen",
  "/organisatie-kiezen",
  ...["tweestaps", "vergrendeld", "uitgelogd", "gelukt"].map((x) => `/paginas/authenticatie/${x}`),
];
export default function AuthenticatiePage({ locale }: { locale: Locale }) {
  return (
    <PageFrame locale={locale} titleKey="nav.paginas.authenticatie" subtitle={t(locale, "demo.pages.auth.subtitle")}>
      <div className="pages-grid">
        {cards.map(([key, icon, title, body], i) => (
          <Link className="page-card" key={key} to={paths[i] ?? "/paginas/authenticatie"}>
            <Icon>{icon}</Icon>
            <div>
              <h2>{title}</h2>
              <p>{body}</p>
            </div>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
