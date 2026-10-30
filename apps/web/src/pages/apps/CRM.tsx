import { Breadcrumb, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { CrmApp } from "./crm/CrmApp.tsx";

export default function CrmPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.apps.crm");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.apps"), href: "/" }, { label: title }]}
      />
      <PageHeader title={title} subtitle={t(locale, "demo.apps.crm.subtitle")} />
      <CrmApp locale={locale} />
    </>
  );
}
