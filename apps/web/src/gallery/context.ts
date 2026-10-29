import { createContext, useContext } from "react";
import { t, DEFAULT_LOCALE } from "@talentstroom/i18n";
import type { MessageKey, Locale } from "@talentstroom/i18n";
export const GalleryContext = createContext<{ locale: Locale; tr: (key: MessageKey) => string }>({
  locale: DEFAULT_LOCALE,
  tr: (key: MessageKey) => t(DEFAULT_LOCALE, key),
});
export const useGallery = () => useContext(GalleryContext);
