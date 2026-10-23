import { afterEach, describe, expect, test, vi } from "vitest";
import { notifyBody, sendNotice } from "./notify";
import { verifyWebhook } from "./webhook-sign";

const ENV = {
  NOTIFY_WEBHOOK_URL: "https://hooks.example.com/x",
  NOTIFY_WEBHOOK_SECRET: "s3cret",
  RESEND_API_KEY: "re_key",
  NOTIFY_EMAIL_FROM: "Sentinel <avisos@example.com>",
  WHATSAPP_TOKEN: "wa_token",
  WHATSAPP_PHONE_NUMBER_ID: "123",
  WHATSAPP_TEMPLATE_NAME: "alerta_incendio",
  // the only recipients a request may address
  NOTIFY_EMAIL_TO: "a@b.com, c@d.com",
  NOTIFY_WHATSAPP_TO: "+5492991234567",
};
const body = (o: object = {}) =>
  notifyBody.parse({
    title: "Foco cerca",
    message: "Hay un foco a 3 km",
    emails: ["a@b.com", "c@d.com"],
    phones: ["+5492991234567"],
    ...o,
  });

afterEach(() => vi.unstubAllGlobals());

describe("notifyBody", () => {
  test("rejects unknown keys, bad emails/phones, http links and too many recipients", () => {
    const ok = (o: object) =>
      notifyBody.safeParse({ title: "t", message: "m", ...o }).success;
    expect(ok({})).toBe(true);
    expect(ok({ extra: 1 })).toBe(false);
    expect(ok({ emails: ["nope"] })).toBe(false);
    expect(ok({ phones: ["12"] })).toBe(false);
    expect(ok({ link: "http://x.com" })).toBe(false);
    expect(
      ok({ emails: Array.from({ length: 11 }, (_, i) => `a${i}@b.com`) }),
    ).toBe(false);
    expect(ok({ title: "   " })).toBe(false);
  });
});

describe("sendNotice", () => {
  test("without env vars every channel says not-configured and nothing is sent", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const r = await sendNotice(body(), {});
    expect(r.map((x) => x.status)).toEqual([
      "not-configured",
      "not-configured",
      "not-configured",
    ]);
    expect(f).not.toHaveBeenCalled();
  });

  test("dryRun reports recipients but sends nothing", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const r = await sendNotice(body({ dryRun: true }), ENV);
    expect(r.map((x) => [x.channel, x.status, x.attempted])).toEqual([
      ["webhook", "dry-run", 1],
      ["email", "dry-run", 2],
      ["whatsapp", "dry-run", 1],
    ]);
    expect(f).not.toHaveBeenCalled();
  });

  test("webhook is signed and verifiable; email goes one per recipient; WhatsApp uses the template", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response("{}", { status: 200 });
      }),
    );
    const now = Date.parse("2026-10-22T12:00:00Z");
    const r = await sendNotice(body(), ENV, now);
    expect(r.every((x) => x.status === "sent")).toBe(true);
    const hook = calls.find((c) => c.url === ENV.NOTIFY_WEBHOOK_URL)!;
    const h = hook.init.headers as Record<string, string>;
    expect(
      verifyWebhook(
        "s3cret",
        h["X-Sentinel-Timestamp"],
        hook.init.body as string,
        h["X-Sentinel-Signature"],
        { nowSec: now / 1000 },
      ),
    ).toBe(true);
    const mails = calls.filter((c) => c.url.includes("resend.com"));
    expect(mails.map((c) => JSON.parse(c.init.body as string).to)).toEqual([
      ["a@b.com"],
      ["c@d.com"],
    ]);
    const wa = calls.find((c) =>
      c.url.includes("graph.facebook.com/v21.0/123/messages"),
    )!;
    const waBody = JSON.parse(wa.init.body as string);
    expect(waBody.to).toBe("5492991234567");
    expect(waBody.template.name).toBe("alerta_incendio");
  });

  test("a provider error reports status only, not its body or the recipient", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response('{"to":"a@b.com"}', { status: 422 })),
    );
    const r = await sendNotice(body({ channels: ["email"] }), ENV);
    expect(r[0]).toMatchObject({ status: "failed", delivered: 0 });
    expect(r[0].error).toContain("422");
    expect(JSON.stringify(r)).not.toContain("a@b.com");
  });

  test("a network failure is reported, never thrown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("down");
      }),
    );
    const r = await sendNotice(body({ channels: ["webhook"] }), ENV);
    expect(r[0].status).toBe("failed");
  });

  test("falls back to env recipients and skips when there are none", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}")),
    );
    const noRecipients = notifyBody.parse({
      title: "t",
      message: "m",
      channels: ["email"],
    });
    expect((await sendNotice(noRecipients, { ...ENV, NOTIFY_EMAIL_TO: undefined }))[0].status).toBe("skipped");
    const r = await sendNotice(noRecipients, {
      ...ENV,
      NOTIFY_EMAIL_TO: "x@y.com, z@y.com",
    });
    expect(r[0]).toMatchObject({ status: "sent", attempted: 2 });
  });
});

describe("recipients and text limits", () => {
  const fetchOk = () => {
    const f = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", f);
    return f;
  };
  test("a request cannot address anyone who is not on the configured lists", async () => {
    const f = fetchOk();
    const out = await sendNotice(
      body({ emails: ["a@b.com", "intruso@evil.com"], phones: ["+5491100000000"], channels: ["email", "whatsapp"] }),
      ENV,
      1_700_000_000_000,
    );
    const email = out.find((r) => r.channel === "email")!;
    const wa = out.find((r) => r.channel === "whatsapp")!;
    expect(email.attempted).toBe(1);
    expect(wa.status).toBe("skipped");
    expect(f.mock.calls.every(([url]) => !String(url).includes("evil"))).toBe(true);
    const sent = f.mock.calls.map(([, init]) => String(init?.body));
    expect(sent.some((b) => b.includes("intruso@evil.com"))).toBe(false);
  });
  test("with no list configured nobody is addressed, even if the request names people", async () => {
    fetchOk();
    const { NOTIFY_EMAIL_TO: _e, ...noList } = ENV;
    void _e;
    const out = await sendNotice(body({ channels: ["email"] }), noList, 1);
    expect(out[0]).toMatchObject({ status: "skipped", attempted: 0 });
  });
  test("a long WhatsApp text is cut in the message, never in the link", async () => {
    const f = fetchOk();
    const link = "https://sentinel.example.com/incidentes/abc";
    await sendNotice(
      body({ message: "x".repeat(1000), link, channels: ["whatsapp"] }),
      ENV,
      1,
    );
    const sent = JSON.parse(String(f.mock.calls[0][1]?.body));
    const text: string = sent.template.components[0].parameters[0].text;
    expect(text.length).toBeLessThanOrEqual(900);
    expect(text.endsWith(link)).toBe(true);
  });
});

describe("email subject", () => {
  test("a title with line breaks cannot inject header lines", async () => {
    const calls: { init: RequestInit }[] = [];
    vi.stubGlobal("fetch", async (_u: string, init: RequestInit) => {
      calls.push({ init });
      return new Response("{}", { status: 200 });
    });
    await sendNotice(body({ title: "Foco\r\nBcc: x@evil.com" }), ENV, 0);
    const mail = calls.find((c) => String(c.init.body).includes('"subject"'))!;
    expect(JSON.parse(mail.init.body as string).subject).toBe("[Sentinel] Foco Bcc: x@evil.com");
  });
});
