import type { Locale } from "@talentstroom/i18n";
import { t } from "@talentstroom/i18n";
import { DemoAuthFrame, DemoPassword } from "./DemoAuthFrame.tsx";

export default function LockScreen({ locale }: { locale: Locale }) {
  return (
    <DemoAuthFrame locale={locale} title={t(locale, "demo.auth.lockTitle")} submitLabel={t(locale, "demo.auth.unlock")}>
      <div className="auth-demo-avatar">MD</div>
      <p>{t(locale, "demo.auth.lockName")}</p>
      <DemoPassword label={t(locale, "auth.password")} />
    </DemoAuthFrame>
  );
}
