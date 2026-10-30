import { Breadcrumb, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { Calendar } from "./agenda/Calendar.tsx";

export default function AgendaPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.apps.agenda");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.apps"), href: "/" }, { label: title }]}
      />
      <PageHeader title={title} subtitle={t(locale, "demo.apps.agenda.subtitle")} />
      <Calendar locale={locale} />
    </>
  );
}
