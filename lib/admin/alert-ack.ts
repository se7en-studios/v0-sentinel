/** Who dealt with an alert, when, and how much activity existed at that moment. */
export interface AlertAck {
  /** ms epoch of the acknowledgement */
  t: number;
  by: string;
  /** detections inside the zone when it was acknowledged */
  n: number;
  /** snooze end (ms epoch); absent = acknowledged until something new happens */
  until?: number;
}

export type AckMap = Record<string, AlertAck>;

export const ACK_MAX = 200;
export const zoneKey = (featId: string) => `zone:${featId}`;

/**
 * An alert counts as handled only while nothing new has happened: more detections than
 * when it was acknowledged re-open it, and a snooze also ends at its deadline.
 */
export function isAcked(
  ack: AlertAck | undefined,
  detections: number,
  now: number,
): boolean {
  if (!ack) return false;
  if (detections > ack.n) return false;
  return ack.until === undefined || now < ack.until;
}

/** Untrusted stored acknowledgements to a safe map; never throws. */
export function cleanAckMap(input: unknown): AckMap {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: AckMap = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= ACK_MAX) break;
    if (!v || typeof v !== "object") continue;
    const { t, by, n, until } = v as Record<string, unknown>;
    if (!Number.isFinite(t) || !Number.isFinite(n)) continue;
    out[k.slice(0, 80)] = {
      t: Number(t),
      by: typeof by === "string" ? by.slice(0, 120) : "",
      n: Number(n),
      ...(Number.isFinite(until) ? { until: Number(until) } : {}),
    };
  }
  return out;
}
