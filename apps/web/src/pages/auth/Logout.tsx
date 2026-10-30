import type { Locale } from "@talentstroom/i18n";
import { t } from "@talentstroom/i18n";
import { DemoAuthFrame } from "./DemoAuthFrame.tsx";

export default function Logout({ locale }: { locale: Locale }) {
  return (
    <DemoAuthFrame locale={locale} title={t(locale, "demo.auth.logoutTitle")}>
      <p>{t(locale, "demo.auth.logoutBody")}</p>
      <a href="/inloggen">{t(locale, "demo.auth.signInAgain")}</a>
    </DemoAuthFrame>
  );
}
