import { Breadcrumb, EmptyState, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";

export default function RecruitmentPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.dashboard.recruitment");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.dashboard"), href: "/" }, { label: title }]}
      />
      <PageHeader title={title} />
      <EmptyState title={title} body={t(locale, "nav.demo_building", { issue: 410 })} />
    </>
  );
}
