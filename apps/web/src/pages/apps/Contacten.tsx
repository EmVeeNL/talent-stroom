import { Breadcrumb, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { ContactsApp } from "./contacten/ContactsApp.tsx";

export default function ContactenPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.apps.contacten");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.apps"), href: "/" }, { label: title }]}
      />
      <PageHeader title={title} subtitle={t(locale, "demo.apps.contacts.subtitle")} />
      <ContactsApp locale={locale} />
    </>
  );
}
