export type Channel = "webhook" | "email" | "whatsapp";
export type ChannelStatus =
  "sent" | "dry-run" | "not-configured" | "failed" | "skipped";

/** A source that answers but takes longer than this is shown as slow (the server probe times out at 6 s). */
export const SLOW_MS = 3000;

export type SourceState = "ok" | "slow" | "down";

export interface SourceRow {
  id: string;
  label: string;
  ok: boolean;
  latencyMs: number;
  ageMin?: number;
  error?: string;
}

export interface HealthView {
  ok: boolean;
  updated: string;
  sources: SourceRow[];
}

export const sourceState = (
  s: Pick<SourceRow, "ok" | "latencyMs">,
): SourceState => (!s.ok ? "down" : s.latencyMs > SLOW_MS ? "slow" : "ok");

const CHANNELS: Channel[] = ["webhook", "email", "whatsapp"];
const STATUSES: ChannelStatus[] = [
  "sent",
  "dry-run",
  "not-configured",
  "failed",
  "skipped",
];
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

/** Untrusted /api/admin/health answer to a safe view, or null when it is not one. */
export function parseHealth(input: unknown): HealthView | null {
  const j = input as { updated?: unknown; sources?: unknown } | null;
  if (!j || !Array.isArray(j.sources)) return null;
  const sources: SourceRow[] = [];
  for (const raw of j.sources) {
    const s = raw as Record<string, unknown> | null;
    if (!s || typeof s.id !== "string" || typeof s.label !== "string") continue;
    sources.push({
      id: s.id.slice(0, 40),
      label: s.label.slice(0, 80),
      ok: s.ok === true,
      latencyMs: Math.max(0, Math.round(num(s.latencyMs))),
      ...(typeof s.ageMin === "number" &&
        Number.isFinite(s.ageMin) && { ageMin: Math.max(0, s.ageMin) }),
      ...(typeof s.error === "string" && { error: s.error.slice(0, 160) }),
    });
  }
  return {
    ok: sources.length > 0 && sources.every((s) => s.ok),
    updated: typeof j.updated === "string" ? j.updated : "",
    sources,
  };
}

export interface ChannelView {
  channel: Channel;
  status: ChannelStatus;
  attempted: number;
  delivered: number;
}

/** Untrusted /api/admin/notify answer to per-channel rows. Free-text errors are dropped on purpose: they could carry personal data. */
export function parseNotify(
  input: unknown,
): { dryRun: boolean; results: ChannelView[] } | null {
  const j = input as { dryRun?: unknown; results?: unknown } | null;
  if (!j || !Array.isArray(j.results)) return null;
  const results: ChannelView[] = [];
  for (const raw of j.results) {
    const r = raw as Record<string, unknown> | null;
    if (
      !r ||
      !CHANNELS.includes(r.channel as Channel) ||
      !STATUSES.includes(r.status as ChannelStatus)
    )
      continue;
    results.push({
      channel: r.channel as Channel,
      status: r.status as ChannelStatus,
      attempted: num(r.attempted),
      delivered: num(r.delivered),
    });
  }
  return { dryRun: j.dryRun === true, results };
}
