import { describe, expect, it, vi } from "vitest";
import {
  LogOnlyTransport,
  MailpitTransport,
  UnconfiguredTransport,
  mailLocale,
  mailTransportFromEnv,
  renderMail,
} from "./index.ts";

const url = "http://localhost:5173/api/auth/verify-email?token=synthetic.token&callbackURL=%2F";

describe("mail templates", () => {
  it("renders Dutch by default", () => {
    const mail = renderMail("verify-email", mailLocale(undefined), "user@example.test", { url, name: "Synthetic" });
    expect(mail.subject).toBe("Bevestig je e-mailadres voor TalentStroom");
    expect(mail.text).toContain("Hallo Synthetic");
    expect(mail.text).toContain(url);
    expect(mail.html).toContain('lang="nl"');
  });

  it("uses English only when English is the first preference", () => {
    expect(mailLocale("en-GB,nl;q=0.8")).toBe("en-GB");
    expect(mailLocale("nl-NL,en;q=0.8")).toBe("nl-NL");
    expect(mailLocale("de-DE")).toBe("nl-NL");
    expect(renderMail("reset-password", "en-GB", "u@example.test", { url, name: "S" }).subject).toBe(
      "Reset your TalentStroom password",
    );
  });

  it("escapes user-controlled values in HTML and links the url", () => {
    const mail = renderMail("invitation", "nl-NL", "u@example.test", {
      url,
      organization: "<b>Bureau</b>",
      inviter: 'Eve "x"',
    });
    expect(mail.subject).toContain("<b>Bureau</b>"); // plain-text header, not HTML
    expect(mail.html).not.toContain("<b>Bureau</b>");
    expect(mail.html).toContain("&lt;b&gt;Bureau&lt;/b&gt;");
    expect(mail.html).toContain(`<a href="${url.replaceAll("&", "&amp;")}">`);
  });
});

describe("mail transports", () => {
  const message = renderMail("verify-email", "nl-NL", "user@example.test", { url, name: "Synthetic" });

  it("posts to the Mailpit send API", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response('{"ID":"x"}', { status: 200 }));
    await new MailpitTransport("http://127.0.0.1:8025", fetchImpl).send(message);
    const [endpoint, init] = fetchImpl.mock.calls[0] ?? [];
    expect(endpoint).toBe("http://127.0.0.1:8025/api/v1/send");
    expect(init?.method).toBe("POST");
    const body: unknown = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    expect(body).toMatchObject({ To: [{ Email: "user@example.test" }], Subject: message.subject, Text: message.text });
  });

  it("fails without echoing the message", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("echo synthetic.token", { status: 400 }));
    const error = await new MailpitTransport("http://127.0.0.1:8025", fetchImpl).send(message).catch((e: Error) => e);
    expect(String(error)).toContain("400");
    expect(String(error)).not.toContain("synthetic.token");
  });

  it("log-only records messages but logs only the template", async () => {
    const lines: string[] = [];
    const transport = new LogOnlyTransport((line) => lines.push(line));
    await transport.send(message);
    expect(transport.sent).toEqual([message]);
    expect(lines.join("\n")).not.toContain("user@example.test");
    expect(lines.join("\n")).not.toContain("synthetic.token");
    expect(lines.join("\n")).toContain("verify-email");
  });

  it("selects the transport from MAIL_TRANSPORT and fails closed otherwise", async () => {
    expect(mailTransportFromEnv({ MAIL_TRANSPORT: "mailpit" })).toBeInstanceOf(MailpitTransport);
    expect(mailTransportFromEnv({ MAIL_TRANSPORT: "log-only-for-tests" })).toBeInstanceOf(LogOnlyTransport);
    const none = mailTransportFromEnv({ MAIL_TRANSPORT: "none" });
    expect(none).toBeInstanceOf(UnconfiguredTransport);
    await expect(none.send(message)).rejects.toThrow("No mail transport configured");
  });
});
