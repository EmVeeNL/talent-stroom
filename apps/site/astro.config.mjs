import { defineConfig } from "astro/config";

export default defineConfig({
  i18n: {
    locales: ["nl", "en"],
    defaultLocale: "nl",
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
});
