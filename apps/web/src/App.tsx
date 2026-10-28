import { DEFAULT_LOCALE, t } from "@talentstroom/i18n";

export function App() {
  const locale = DEFAULT_LOCALE;
  return (
    <main style={{ padding: 32 }}>
      <h1>{t(locale, "app.welcome", { app: t(locale, "app.name") })}</h1>
      <p>{t(locale, "app.tagline")}</p>
    </main>
  );
}
