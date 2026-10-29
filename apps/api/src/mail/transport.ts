/** Which auth email this is. The only message attribute that may appear in logs. */
export type MailTemplate = "verify-email" | "reset-password" | "invitation";

export interface MailMessage {
  template: MailTemplate;
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Delivers one message. Implementations must never log recipients, subjects, bodies or
 * links (they carry tokens), and must throw on failure without echoing the message.
 * Production provider: #232.
 */
export interface MailTransport {
  readonly name: string;
  send(message: MailMessage): Promise<void>;
}

export const MAIL_FROM = { email: "no-reply@talentstroom.invalid", name: "TalentStroom" } as const;
