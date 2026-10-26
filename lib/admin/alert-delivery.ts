// When an alert rule may be sent by email / WhatsApp: the person's limits (how often, how many a day) and
// the record of what already went out. Pure, so the policy can be tested without a browser or a server.

import type { Settings } from "./types";

type Notify = Settings["notify"];

/** Offered as "at most one message per rule every...", in minutes. */
export const INTERVAL_OPTIONS = [15, 60, 360, 1440] as const;
export const MAX_PER_DAY_LIMIT = 50;
const DAY_MS = 86_400_000;

// the server checks the same shapes (lib/server/notify.ts): a contact that would be rejected there is not sent from here
const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[1-9]\d{7,14}$/;

export const isEmail = (v: string): boolean => v.length <= 254 && EMAIL.test(v);
export const isPhone = (v: string): boolean => PHONE.test(v);

const text = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** Untrusted stored notify settings (localStorage or cloud) to a safe object; never throws. */
export function cleanNotify(input: unknown, base: Notify): Notify {
  const n = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const flag = (k: keyof Notify) =>
    typeof n[k] === "boolean" ? (n[k] as boolean) : (base[k] as boolean);
  const per = Number(n.maxPerDay);
  return {
    email: text(n.email, 254),
    whatsapp: text(n.whatsapp, 20),
    onZoneHit: flag("onZoneHit"),
    onSensor: flag("onSensor"),
    browser: flag("browser"),
    deliver: n.deliver === true,
    minIntervalMin: (INTERVAL_OPTIONS as readonly number[]).includes(
      Number(n.minIntervalMin),
    )
      ? Number(n.minIntervalMin)
      : base.minIntervalMin,
    maxPerDay: Number.isFinite(per)
      ? Math.min(MAX_PER_DAY_LIMIT, Math.max(1, Math.round(per)))
      : base.maxPerDay,
  };
}

/** Who a message would go to, from what the person typed: only values the server would accept. */
export function contactsOf(n: Pick<Notify, "email" | "whatsapp">): {
  emails: string[];
  phones: string[];
} {
  return {
    emails: isEmail(n.email) ? [n.email] : [],
    phones: isPhone(n.whatsapp) ? [n.whatsapp] : [],
  };
}

export interface DeliveryResult {
  /** ms epoch */
  at: number;
  ruleId: string;
  channels: { channel: string; status: string }[];
}

export interface DeliveryState {
  /** ms epoch of the last message per rule */
  lastByRule: Record<string, number>;
  /** ms epoch of every message in the last 24 h, all rules together */
  sent: number[];
  last?: DeliveryResult;
}

export const EMPTY_DELIVERY: DeliveryState = { lastByRule: {}, sent: [] };

/** Untrusted stored state to a safe one; anything older than a day is dropped. */
export function cleanDelivery(input: unknown, now: number): DeliveryState {
  const s = (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
  const fresh = (t: unknown): t is number =>
    typeof t === "number" &&
    Number.isFinite(t) &&
    t > now - DAY_MS &&
    t <= now + 60_000;
  const lastByRule: Record<string, number> = {};
  if (s.lastByRule && typeof s.lastByRule === "object")
    for (const [k, v] of Object.entries(
      s.lastByRule as Record<string, unknown>,
    ).slice(0, 100))
      if (fresh(v)) lastByRule[k.slice(0, 40)] = v;
  const sent = Array.isArray(s.sent)
    ? s.sent.filter(fresh).slice(-MAX_PER_DAY_LIMIT)
    : [];
  const l = s.last as Partial<DeliveryResult> | undefined;
  const last =
    l &&
    typeof l.at === "number" &&
    typeof l.ruleId === "string" &&
    Array.isArray(l.channels)
      ? {
          at: l.at,
          ruleId: l.ruleId.slice(0, 40),
          channels: l.channels
            .filter(
              (c) =>
                c &&
                typeof c.channel === "string" &&
                typeof c.status === "string",
            )
            .slice(0, 5)
            .map((c) => ({
              channel: c.channel.slice(0, 20),
              status: c.status.slice(0, 20),
            })),
        }
      : undefined;
  return { lastByRule, sent, ...(last ? { last } : {}) };
}

export type Verdict =
  | { send: true }
  | { send: false; reason: "off" | "no-contact" | "interval" | "daily" };

/** May this rule go out now? "off" and "no-contact" are silent; "interval" and "daily" are the anti-spam limits. */
export function decideDelivery(
  state: DeliveryState,
  notify: Notify,
  ruleId: string,
  now: number,
): Verdict {
  if (!notify.deliver) return { send: false, reason: "off" };
  const { emails, phones } = contactsOf(notify);
  if (emails.length + phones.length === 0)
    return { send: false, reason: "no-contact" };
  const last = state.lastByRule[ruleId];
  if (last !== undefined && now - last < notify.minIntervalMin * 60_000)
    return { send: false, reason: "interval" };
  if (state.sent.filter((t) => t > now - DAY_MS).length >= notify.maxPerDay)
    return { send: false, reason: "daily" };
  return { send: true };
}

/** The state after a message went out. Returns a new object. */
export function recordDelivery(
  state: DeliveryState,
  result: DeliveryResult,
): DeliveryState {
  return {
    lastByRule: { ...state.lastByRule, [result.ruleId]: result.at },
    sent: [
      ...state.sent.filter((t) => t > result.at - DAY_MS),
      result.at,
    ].slice(-MAX_PER_DAY_LIMIT),
    last: result,
  };
}
