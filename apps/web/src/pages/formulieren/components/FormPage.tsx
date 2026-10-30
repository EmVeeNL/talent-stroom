import type { ReactNode } from "react";
import { Breadcrumb, Card, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import "./forms.css";

export function FormPage({
  locale,
  titleKey,
  children,
}: {
  locale: Locale;
  titleKey: MessageKey;
  children: ReactNode;
}) {
  const title = t(locale, titleKey);
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.formulieren") }, { label: title }]}
      />
      <PageHeader title={title} />
      <div className="demo-form-page">{children}</div>
    </>
  );
}
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card as="section" title={title}>
      <div className="demo-form-section">{children}</div>
    </Card>
  );
}
