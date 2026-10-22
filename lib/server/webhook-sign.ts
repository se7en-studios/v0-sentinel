import { createHmac, timingSafeEqual } from "node:crypto";

export const DEFAULT_TOLERANCE_SEC = 300;

/** HMAC-SHA256 hex over `${timestamp}.${body}`; timestamp is unix seconds. */
export function signWebhook(
  secret: string,
  timestamp: number | string,
  body: string,
): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

/** Constant-time check plus replay window (default 5 min, both directions). */
export function verifyWebhook(
  secret: string,
  timestamp: number | string,
  body: string,
  signature: string,
  opts: { toleranceSec?: number; nowSec?: number } = {},
): boolean {
  const ts = Number(timestamp);
  if (!secret || !Number.isFinite(ts)) return false;
  const now = opts.nowSec ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > (opts.toleranceSec ?? DEFAULT_TOLERANCE_SEC))
    return false;
  const a = Buffer.from(signWebhook(secret, timestamp, body), "hex");
  const b = Buffer.from(String(signature), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
