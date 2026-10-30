import { Breadcrumb, PageHeader } from "@talentstroom/ui";
import { t } from "@talentstroom/i18n";
import type { Locale } from "@talentstroom/i18n";
import { ChatApp } from "./chat/ChatApp.tsx";

export default function ChatPage({ locale }: { locale: Locale }) {
  const title = t(locale, "nav.apps.chat");
  return (
    <>
      <Breadcrumb
        label={t(locale, "nav.breadcrumbs")}
        items={[{ label: t(locale, "nav.group.apps"), href: "/" }, { label: title }]}
      />
      <PageHeader title={title} subtitle={t(locale, "demo.apps.chat.subtitle")} />
      <ChatApp locale={locale} />
    </>
  );
}
