import { useEffect, useState } from "react";
import { createApiClient } from "@talentstroom/api-client";
import { DEFAULT_LOCALE, t } from "@talentstroom/i18n";
import { lazy, Suspense } from "react";

// Dev-only component showcase: `?gallery`. Tree-shaken from production builds.
const ComponentGallery = import.meta.env.DEV
  ? lazy(() => import("./ComponentGallery.tsx").then((m) => ({ default: m.ComponentGallery })))
  : null;

const apiClient = createApiClient();

export function App() {
  if (ComponentGallery && new URLSearchParams(window.location.search).has("gallery")) {
    return (
      <Suspense fallback={null}>
        <ComponentGallery />
      </Suspense>
    );
  }
  return <Home />;
}

function Home() {
  const locale = DEFAULT_LOCALE;
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    void apiClient
      .GET("/health")
      .then(({ data, error }) => {
        setApiStatus(data?.status === "ok" && !error ? "ok" : "error");
      })
      .catch(() => setApiStatus("error"));
  }, []);

  return (
    <main style={{ padding: 32 }}>
      <h1>{t(locale, "app.welcome", { app: t(locale, "app.name") })}</h1>
      <p>{t(locale, "app.tagline")}</p>
      <p>
        {apiStatus === "loading"
          ? t(locale, "app.apiStatus.loading")
          : apiStatus === "ok"
            ? "ok"
            : t(locale, "app.apiStatus.error")}
      </p>
    </main>
  );
}
