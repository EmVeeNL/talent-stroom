import { Breadcrumb, EmptyState, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";

export default function ContactPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.paginas.contact");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.paginas") }, { label: title }]}
      />
      <PageHeader title={title} />
      <EmptyState title={title} body={t(locale, "nav.demo_building", { issue: 414 })} />
    </>
  );
}
