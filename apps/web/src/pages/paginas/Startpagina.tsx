import { Card, EmptyState } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { PageFrame } from "./pageShared.tsx";
export default function StartpaginaPage({ locale }: { locale: Locale }) {
  return (
    <PageFrame locale={locale} titleKey="nav.paginas.startpagina" subtitle={t(locale, "demo.pages.starter.subtitle")}>
      <div className="page-stack">
        <Card>
          <EmptyState
            title={t(locale, "demo.pages.starter.emptyTitle")}
            body={t(locale, "demo.pages.starter.emptyBody")}
          />
        </Card>
      </div>
    </PageFrame>
  );
}
