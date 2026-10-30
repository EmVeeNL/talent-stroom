import { Breadcrumb, Button, Icon, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { DesignKitOverview } from "../../kit/DesignKitOverview.tsx";
import "../../kit/demo-kit.css";
export default function OverzichtDesignKitPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.elementen.overzicht_design_kit");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.elementen") }, { label: title }]}
      />
      <PageHeader
        title={`${t(locale, "demo.kit.greeting")} 👋`}
        subtitle={t(locale, "demo.kit.subtitle")}
        actions={
          <div className="demo-kit-page-actions">
            <span>
              <Icon name="calendar_month" size={16} /> {t(locale, "demo.kit.date")}
            </span>
            <Button icon="add">{t(locale, "demo.kit.newCandidate")}</Button>
          </div>
        }
      />
      <DesignKitOverview locale={locale} />
    </>
  );
}
