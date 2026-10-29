import { LogOnlyTransport, UnconfiguredTransport } from "./log-only.ts";
import { DEFAULT_MAILPIT_URL, MailpitTransport } from "./mailpit.ts";
import type { MailTransport } from "./transport.ts";

export { LogOnlyTransport, UnconfiguredTransport } from "./log-only.ts";
export { MailpitTransport } from "./mailpit.ts";
export { mailLocale, renderMail } from "./templates.ts";
export type { MailMessage, MailTemplate, MailTransport } from "./transport.ts";

export interface MailSettings {
  /** wrangler.jsonc var ("none"); apps/api/.env sets "mailpit" locally. */
  MAIL_TRANSPORT?: string;
}

/** Picks the transport from the environment. Unknown or unset values fail closed on send. */
export function mailTransportFromEnv(env: MailSettings): MailTransport {
  switch (env.MAIL_TRANSPORT) {
    case "mailpit":
      return new MailpitTransport(DEFAULT_MAILPIT_URL);
    case "log-only-for-tests":
      return new LogOnlyTransport();
    default:
      return new UnconfiguredTransport();
  }
}
