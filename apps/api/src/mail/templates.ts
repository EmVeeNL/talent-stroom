import { DEFAULT_LOCALE, t, type Locale, type MessageKey } from "@talentstroom/i18n";
import type { MailMessage, MailTemplate } from "./transport.ts";

const APP = "TalentStroom";

const KEYS = {
  "verify-email": { subject: "mail.verifyEmail.subject", body: "mail.verifyEmail.body" },
  "reset-password": { subject: "mail.resetPassword.subject", body: "mail.resetPassword.body" },
  invitation: { subject: "mail.invitation.subject", body: "mail.invitation.body" },
} as const satisfies Record<MailTemplate, { subject: MessageKey; body: MessageKey }>;

/**
 * Dutch is the source and the default; English only when the request's first language
 * preference is English (`Accept-Language`). Anything else falls back to Dutch.
 */
export function mailLocale(acceptLanguage: string | null | undefined): Locale {
  const first = acceptLanguage?.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("en") ? "en-GB" : DEFAULT_LOCALE;
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);

/** Values are user-controlled (names) or contain tokens (url): escape for HTML, never log. */
export function renderMail(
  template: MailTemplate,
  locale: Locale,
  to: string,
  values: { url: string; name?: string; organization?: string; inviter?: string },
): MailMessage {
  const all = { app: APP, name: "", organization: "", inviter: "", ...values };
  const subject = t(locale, KEYS[template].subject, all);
  const body = t(locale, KEYS[template].body, all);
  const footer = t(locale, "mail.footer", { app: APP });
  const text = `${body}\n\n--\n${footer}\n`;
  const escapedUrl = escapeHtml(values.url);
  const paragraphs = escapeHtml(body)
    .split("\n\n")
    .map((p) => `<p>${p.replaceAll("\n", "<br>").replace(escapedUrl, `<a href="${escapedUrl}">${escapedUrl}</a>`)}</p>`)
    .join("");
  const html = `<!doctype html><html lang="${locale.slice(0, 2)}"><body>${paragraphs}<hr><p><small>${escapeHtml(footer)}</small></p></body></html>`;
  return { template, to, subject, text, html };
}
