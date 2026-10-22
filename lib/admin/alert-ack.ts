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
/** ~5 km cell, the same identity the early-alert toasts use: a spot keeps its key while its first scan drifts */
const EARLY_CELL = 0.05;
export const earlyKey = (e: { lat: number; lng: number }) =>
  `early:${Math.round(e.lat / EARLY_CELL)},${Math.round(e.lng / EARLY_CELL)}`;
export const ruleKey = (ruleId: string) => `rule:${ruleId}`;
/** a rule has no detection count to grow, so acknowledging it always carries a deadline */
export const RULE_ACK_DEFAULT_MIN = 24 * 60;

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

/** Early detections nobody has acknowledged or snoozed (they carry only a deadline, like rules). */
export function pendingEarly<T extends { lat: number; lng: number }>(
  list: T[],
  acks: AckMap,
  now: number,
): T[] {
  return list.filter((e) => !isAcked(acks[earlyKey(e)], 0, now));
}

/** Untrusted stored acknowledgements to a safe map; never throws. */
export function cleanAckMap(input: unknown): AckMap {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const rows: [string, AckMap[string]][] = [];
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const { t, by, n, until } = v as Record<string, unknown>;
    if (!Number.isFinite(t) || !Number.isFinite(n)) continue;
    rows.push([
      k.slice(0, 80),
      {
        t: Number(t),
        by: typeof by === "string" ? by.slice(0, 120) : "",
        n: Number(n),
        ...(Number.isFinite(until) ? { until: Number(until) } : {}),
      },
    ]);
  }
  // early alerts add a key per ~5 km cell, so the map can outgrow the cap: keep the newest acknowledgements
  return Object.fromEntries(
    rows.sort((a, b) => b[1].t - a[1].t).slice(0, ACK_MAX),
  );
}
