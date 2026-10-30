import type { Locale } from "@talentstroom/i18n";
import { t } from "@talentstroom/i18n";
import { DemoAuthFrame } from "./DemoAuthFrame.tsx";

export default function Success({ locale }: { locale: Locale }) {
  return (
    <DemoAuthFrame locale={locale} title={t(locale, "demo.auth.successTitle")}>
      <output>{t(locale, "demo.auth.successBody")}</output>
    </DemoAuthFrame>
  );
}
