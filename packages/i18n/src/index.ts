import { enGB } from "./messages/en-GB.ts";
import { nlNL, type MessageKey } from "./messages/nl-NL.ts";

export type { MessageKey };

export const LOCALES = ["nl-NL", "en-GB"] as const;
export type Locale = (typeof LOCALES)[number];

/** Dutch is the source of truth for product copy; English must cover every key. */
export const DEFAULT_LOCALE: Locale = "nl-NL";

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  "nl-NL": nlNL,
  "en-GB": enGB,
};

/** Translate a message key, replacing `{name}` placeholders with the given values. */
export function t(locale: Locale, key: MessageKey, values: Record<string, string | number> = {}): string {
  return catalogs[locale][key].replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
