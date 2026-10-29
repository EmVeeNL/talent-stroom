import type { MailMessage, MailTransport } from "./transport.ts";

/**
 * For tests: keeps messages in memory on this instance so a test can read the link, and logs
 * only the template name. Never selected implicitly; an instance lives as long as its owner.
 */
export class LogOnlyTransport implements MailTransport {
  readonly name = "log-only-for-tests";
  readonly sent: MailMessage[] = [];
  readonly #log: (line: string) => void;

  constructor(log: (line: string) => void = (line) => console.info(line)) {
    this.#log = log;
  }

  send(message: MailMessage): Promise<void> {
    this.sent.push(message);
    this.#log(JSON.stringify({ message: "mail recorded (log-only transport)", template: message.template }));
    return Promise.resolve();
  }
}

/** Fails closed when no transport is configured, without touching the message. */
export class UnconfiguredTransport implements MailTransport {
  readonly name = "unconfigured";
  send(): Promise<void> {
    return Promise.reject(new Error("No mail transport configured (MAIL_TRANSPORT)"));
  }
}
