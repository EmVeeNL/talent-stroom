import { useState } from "react";
import { t } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { Button } from "@talentstroom/ui";
import { PageFrame, Icon, Link } from "./pageShared.tsx";
type ErrorKind = "401" | "403" | "404" | "500" | "503" | "offline";
const data: Record<ErrorKind, { title: MessageKey; body: MessageKey; icon: string; code: string }> = {
  "401": { title: "demo.pages.error.401.title", body: "demo.pages.error.401.body", icon: "lock", code: "401" },
  "403": { title: "demo.pages.error.403.title", body: "demo.pages.error.403.body", icon: "shield", code: "403" },
  "404": { title: "nav.not_found.title", body: "nav.not_found.body", icon: "search_off", code: "404" },
  "500": { title: "demo.pages.error.500.title", body: "demo.pages.error.500.body", icon: "error", code: "500" },
  "503": { title: "demo.pages.error.503.title", body: "demo.pages.error.503.body", icon: "construction", code: "503" },
  offline: {
    title: "demo.pages.error.offline.title",
    body: "demo.pages.error.offline.body",
    icon: "wifi_off",
    code: "Offline",
  },
};
export function ErrorPage({
  locale,
  kind,
  standalone = false,
}: {
  locale: Locale;
  kind?: ErrorKind;
  /** A real error route: the title is the page's h1. Examples on the index use h2. */
  standalone?: boolean;
}) {
  const item = data[kind ?? "404"];
  const Heading = standalone ? "h1" : "h2";
  return (
    <section className="page-panel page-error">
      <div className="page-error-content">
        <Icon>{item.icon}</Icon>
        <div className="page-error-code">{item.code}</div>
        <Heading>{t(locale, item.title)}</Heading>
        <p>{t(locale, item.body)}</p>
      </div>
      <div className="page-actions">
        <Link className="ts-button ts-button--primary ts-button--md" to="/">
          {t(locale, "demo.pages.error.home")}
        </Link>
        <Button variant="secondary" onClick={() => window.history.back()}>
          {t(locale, "demo.pages.error.back")}
        </Button>
      </div>
    </section>
  );
}
export default function FoutpaginasPage({ locale }: { locale: Locale }) {
  const [selected, setSelected] = useState<ErrorKind>("404");
  const kinds: ErrorKind[] = ["401", "403", "404", "500", "503", "offline"];
  return (
    <PageFrame locale={locale} titleKey="nav.paginas.foutpaginas" subtitle={t(locale, "demo.pages.error.subtitle")}>
      <div className="pages-grid">
        {kinds.map((k) => (
          <button className="page-card" key={k} onClick={() => setSelected(k)} aria-pressed={selected === k}>
            <Icon>{data[k].icon}</Icon>
            <div>
              <h2>
                {k === "offline" ? "Offline · " : `${data[k].code} · `}
                {t(locale, data[k].title)}
              </h2>
              <p>{t(locale, data[k].body)}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="page-tabs" role="tablist" aria-label={t(locale, "demo.pages.error.variants")}>
        {kinds.map((k) => (
          <button role="tab" aria-selected={selected === k} key={k} onClick={() => setSelected(k)}>
            {k === "offline" ? "Offline" : data[k].code}
          </button>
        ))}
      </div>
      <ErrorPage locale={locale} kind={selected} />
    </PageFrame>
  );
}
