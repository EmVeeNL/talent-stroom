import type { ReactNode } from "react";
import { Breadcrumb, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { Link } from "../../Link.tsx";
import "./pages.css";

export function PageFrame({
  locale,
  titleKey,
  children,
  subtitle,
}: {
  locale: Locale;
  titleKey: MessageKey;
  children: ReactNode;
  subtitle?: string;
}) {
  const title = t(locale, titleKey);
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.paginas") }, { label: title }]}
      />
      <PageHeader title={title} {...(subtitle ? { subtitle } : {})} />
      {children}
    </>
  );
}
export function Icon({ children }: { children: string }) {
  return (
    <span className="material-symbols-rounded page-icon" aria-hidden="true">
      {children}
    </span>
  );
}
export { Link };
