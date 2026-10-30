import { EmptyState, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
export default function NotFound({ locale }: { locale: Locale }) {
  return (
    <>
      <PageHeader title={t(locale, "nav.not_found.title")} subtitle={t(locale, "nav.not_found.subtitle")} />
      <EmptyState
        variant="no-results"
        title={t(locale, "nav.not_found.title")}
        body={t(locale, "nav.not_found.body")}
      />
    </>
  );
}
