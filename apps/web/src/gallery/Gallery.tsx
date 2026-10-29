import { useEffect, useState } from "react";
import { Tabs, ThemeToggle, setThemePreference } from "@talentstroom/ui";
import { t, DEFAULT_LOCALE, LOCALES, isLocale } from "@talentstroom/i18n";
import type { Locale, MessageKey } from "@talentstroom/i18n";
import { pages } from "./pages/index.ts";
import { GalleryContext } from "./context.ts";
import "./gallery.css";
const readPage = () => pages.find((p) => p.id === window.location.hash.slice(1))?.id ?? "layout";
export function Gallery() {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const theme = new URLSearchParams(window.location.search).get("theme");
    if (theme === "light" || theme === "dark") setThemePreference(theme);
  }, []);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [page, setPage] = useState<string>(readPage);
  const tr = (key: MessageKey) => t(locale, key);
  useEffect(() => {
    const update = () => setPage(readPage());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [locale]);
  return (
    <GalleryContext value={{ tr, locale }}>
      <main className="gallery" lang={locale}>
        <header className="gallery-header">
          <div>
            <h1>{tr("gallery.title")}</h1>
            <p>{tr("gallery.intro")}</p>
          </div>
          <div className="gallery-controls">
            <ThemeToggle
              label={tr("gallery.theme")}
              labels={{
                system: tr("gallery.theme.system"),
                light: tr("gallery.theme.light"),
                dark: tr("gallery.theme.dark"),
              }}
            />
            <label>
              {tr("gallery.language")}
              <select
                value={locale}
                onChange={(e) => {
                  if (isLocale(e.target.value)) setLocale(e.target.value);
                }}
              >
                {LOCALES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>
        <Tabs
          label={tr("gallery.categories")}
          selectedId={page}
          onChange={(id) => {
            window.location.hash = id;
            setPage(id);
          }}
          tabs={pages.map(({ id, titleKey, Page }) => ({ id, label: tr(titleKey), panel: <Page /> }))}
        />
      </main>
    </GalleryContext>
  );
}
