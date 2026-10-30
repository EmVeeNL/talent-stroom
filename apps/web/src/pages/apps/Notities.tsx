import { Breadcrumb, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { NotesApp } from "./notities/NotesApp.tsx";

export default function NotitiesPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.apps.notities");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.apps"), href: "/" }, { label: title }]}
      />
      <PageHeader title={title} subtitle={t(locale, "demo.apps.notes.subtitle")} />
      <NotesApp locale={locale} />
    </>
  );
}
