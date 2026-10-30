import { Breadcrumb, EmptyState, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";

export default function ValidatiePage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.formulieren.validatie");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.formulieren") }, { label: title }]}
      />
      <PageHeader title={title} />
      <EmptyState title={title} body={t(locale, "nav.demo_building", { issue: 412 })} />
    </>
  );
}
