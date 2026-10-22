import { z } from "zod";
import { signWebhook } from "./webhook-sign";

const MAX_RECIPIENTS = 10;
const SEND_TIMEOUT_MS = 10_000;
const WA_API = "https://graph.facebook.com/v21.0";

export const notifyBody = z
  .object({
    title: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(1000),
    severity: z.enum(["info", "warning", "critical"]).default("warning"),
    link: z
      .string()
      .url()
      .max(500)
      .refine((u) => u.startsWith("https://"), "https")
      .optional(),
    channels: z
      .array(z.enum(["webhook", "email", "whatsapp"]))
      .min(1)
      .max(3)
      .optional(),
    emails: z
      .array(z.string().trim().email().max(254))
      .max(MAX_RECIPIENTS)
      .optional(),
    phones: z
      .array(z.string().trim().regex(/^\+?[1-9]\d{7,14}$/, "E.164"))
      .max(MAX_RECIPIENTS)
      .optional(),
    dryRun: z.boolean().default(false),
  })
  .strict();
export type NotifyBody = z.infer<typeof notifyBody>;

export type Channel = "webhook" | "email" | "whatsapp";
export interface ChannelResult {
  channel: Channel;
  status: "sent" | "dry-run" | "not-configured" | "failed" | "skipped";
  /** recipients addressed (webhook counts as 1) */
  attempted: number;
  delivered: number;
  /** fixed text or HTTP status only: provider bodies can echo personal data */
  error?: string;
}

type Env = Record<string, string | undefined>;
type Outcome = Pick<ChannelResult, "status" | "delivered" | "error">;

const WA_TEXT_MAX = 900;

/** The configured list, or the part of the requested list that is on it. Nothing configured means nobody. */
const recipients = (requested: string[] | undefined, configured: string | undefined) => {
  const allowed = csv(configured).slice(0, MAX_RECIPIENTS);
  return requested ? requested.filter((r) => allowed.includes(r)) : allowed;
};

const csv = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

async function post(
  url: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(url, {
      ...init,
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

const outcome = (n: number, statuses: { ok: boolean; status: number }[]): Outcome => {
  const ok = statuses.filter((s) => s.ok).length;
  if (ok === n) return { status: "sent", delivered: ok };
  const codes = [
    ...new Set(statuses.filter((s) => !s.ok).map((s) => s.status || "sin respuesta")),
  ];
  return {
    status: "failed",
    delivered: ok,
    error: `El proveedor rechazó o no respondió (${codes.join(", ")})`,
  };
};

const sendMany = async (
  items: string[],
  one: (x: string) => Promise<{ ok: boolean; status: number }>,
): Promise<Outcome> => outcome(items.length, await Promise.all(items.map(one)));

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

async function webhook(
  b: NotifyBody,
  env: Env,
  now: number,
): Promise<ChannelResult> {
  const url = env.NOTIFY_WEBHOOK_URL;
  const secret = env.NOTIFY_WEBHOOK_SECRET;
  if (!url || !secret || !url.startsWith("https://"))
    return { channel: "webhook", status: "not-configured", attempted: 0, delivered: 0 };
  const base = { channel: "webhook", attempted: 1 } as const;
  if (b.dryRun) return { ...base, status: "dry-run", delivered: 0 };
  const ts = Math.floor(now / 1000);
  const body = JSON.stringify({
    title: b.title,
    message: b.message,
    severity: b.severity,
    link: b.link,
    sentAt: new Date(now).toISOString(),
  });
  const r = await post(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Sentinel-Timestamp": String(ts),
      "X-Sentinel-Signature": signWebhook(secret, ts, body),
    },
    body,
  });
  return { ...base, ...outcome(1, [r]) };
}

async function email(b: NotifyBody, env: Env): Promise<ChannelResult> {
  const key = env.RESEND_API_KEY;
  const from = env.NOTIFY_EMAIL_FROM;
  if (!key || !from)
    return { channel: "email", status: "not-configured", attempted: 0, delivered: 0 };
  // only addresses the operator listed in the environment: a stolen session cannot mail strangers
  const to = recipients(b.emails, env.NOTIFY_EMAIL_TO);
  const base = { channel: "email", attempted: to.length } as const;
  if (!to.length)
    return {
      ...base,
      status: "skipped",
      delivered: 0,
      error: "Sin destinatarios (definí NOTIFY_EMAIL_TO; los emails del pedido deben figurar ahí)",
    };
  if (b.dryRun) return { ...base, status: "dry-run", delivered: 0 };
  const text = `${b.message}${b.link ? `\n\n${b.link}` : ""}`;
  // one message per recipient so nobody sees the others' addresses
  return {
    ...base,
    ...(await sendMany(to, (addr) =>
      post("https://api.resend.com/emails", {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [addr],
          subject: `[Sentinel] ${b.title}`,
          text,
        }),
      }),
    )),
  };
}

async function whatsapp(b: NotifyBody, env: Env): Promise<ChannelResult> {
  const token = env.WHATSAPP_TOKEN;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  const template = env.WHATSAPP_TEMPLATE_NAME;
  if (!token || !phoneId || !template)
    return { channel: "whatsapp", status: "not-configured", attempted: 0, delivered: 0 };
  const to = recipients(b.phones, env.NOTIFY_WHATSAPP_TO).map((p) =>
    p.replace(/^\+/, ""),
  );
  const base = { channel: "whatsapp", attempted: to.length } as const;
  if (!to.length)
    return {
      ...base,
      status: "skipped",
      delivered: 0,
      error: "Sin destinatarios (definí NOTIFY_WHATSAPP_TO; los teléfonos del pedido deben figurar ahí)",
    };
  if (b.dryRun) return { ...base, status: "dry-run", delivered: 0 };
  // business-initiated messages must be an approved template; its single {{1}} gets "title: message"
  // cut the message, never the link at the end
  const link = b.link ? ` ${b.link}` : "";
  const text =
    oneLine(`${b.title}: ${b.message}`).slice(0, Math.max(0, WA_TEXT_MAX - link.length)) +
    link;
  return {
    ...base,
    ...(await sendMany(to, (num) =>
      post(`${WA_API}/${encodeURIComponent(phoneId)}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: num,
          type: "template",
          template: {
            name: template,
            language: { code: env.WHATSAPP_TEMPLATE_LANG || "es_AR" },
            components: [{ type: "body", parameters: [{ type: "text", text }] }],
          },
        }),
      }),
    )),
  };
}

const SENDERS = { webhook, email, whatsapp } as const;

/** Sends one notice through each requested channel (default: all). Channels without env vars report "not-configured". */
export async function sendNotice(
  b: NotifyBody,
  env: Env = process.env,
  now = Date.now(),
): Promise<ChannelResult[]> {
  const channels = b.channels ?? (["webhook", "email", "whatsapp"] as Channel[]);
  return Promise.all([...new Set(channels)].map((c) => SENDERS[c](b, env, now)));
}
