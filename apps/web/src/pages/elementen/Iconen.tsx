import { Breadcrumb, EmptyState, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";

export default function IconenPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.elementen.iconen");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.elementen") }, { label: title }]}
      />
      <PageHeader title={title} />
      <EmptyState title={title} body={t(locale, "nav.demo_building", { issue: 412 })} />
    </>
  );
}
