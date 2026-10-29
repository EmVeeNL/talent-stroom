import { MAIL_FROM, type MailMessage, type MailTransport } from "./transport.ts";

export const DEFAULT_MAILPIT_URL = "http://127.0.0.1:8025";

/**
 * Local development inbox (ADR 0006 owner decision 7). Uses Mailpit's HTTP send API,
 * `POST /api/v1/send` (https://mailpit.axllent.org/docs/api-v1/view.html#post-/api/v1/send),
 * verified against Mailpit v1.31.6 from compose.yaml. Read the mail at http://localhost:8025.
 */
export class MailpitTransport implements MailTransport {
  readonly name = "mailpit";
  readonly #endpoint: string;
  readonly #fetch: typeof fetch;

  constructor(baseUrl: string = DEFAULT_MAILPIT_URL, fetchImpl?: typeof fetch) {
    this.#endpoint = new URL("/api/v1/send", baseUrl).toString();
    // Workers' fetch must not be called as a method of another object ("Illegal invocation").
    this.#fetch = fetchImpl ?? ((input, init) => fetch(input, init));
  }

  async send(message: MailMessage): Promise<void> {
    const response = await this.#fetch(this.#endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        From: { Email: MAIL_FROM.email, Name: MAIL_FROM.name },
        To: [{ Email: message.to }],
        Subject: message.subject,
        Text: message.text,
        HTML: message.html,
        Tags: [message.template],
      }),
    });
    // Drain the body; never include it or the request in the error (it can echo the message).
    await response.body?.cancel();
    if (!response.ok) throw new Error(`Mailpit send failed with status ${response.status}`);
  }
}
