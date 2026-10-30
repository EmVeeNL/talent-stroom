import { Breadcrumb, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { KanbanApp } from "./kanban/KanbanApp.tsx";

export default function KanbanbordPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.apps.kanbanbord");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.apps"), href: "/" }, { label: title }]}
      />
      <PageHeader title={title} subtitle={t(locale, "demo.apps.kanban.subtitle")} />
      <KanbanApp locale={locale} />
    </>
  );
}
