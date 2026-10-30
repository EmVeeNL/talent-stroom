import { Breadcrumb, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { ElementsBasic } from "../../kit/ElementSections.tsx";
import "../../kit/demo-kit.css";
export default function BasisPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.elementen.basis");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.elementen") }, { label: title }]}
      />
      <PageHeader title={title} />
      <ElementsBasic locale={locale} />
    </>
  );
}
