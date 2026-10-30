import { Breadcrumb, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { ElementsCards } from "../../kit/ElementSections.tsx";
import "../../kit/demo-kit.css";
export default function KaartenPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.elementen.kaarten");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.elementen") }, { label: title }]}
      />
      <PageHeader title={title} />
      <ElementsCards locale={locale} />
    </>
  );
}
