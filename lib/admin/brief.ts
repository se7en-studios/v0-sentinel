// "What happened since last time": the few things worth looking at, most urgent first, each with
// where to go. Pure so the rules can be tested without a browser.

import type { FirePoint, SourceStatus } from "./types";

/** Satellite data older than this counts as late (the status strip uses the same limit). */
export const STALE_MIN = 6 * 60;

export type BriefKind =
  "error" | "zones" | "rules" | "early" | "down" | "stale" | "fires";
export type BriefGo = "retry" | "zonas" | "alerts" | "incendios" | "sources";

export interface BriefItem {
  kind: BriefKind;
  /** how many (minutes of delay for "stale") */
  n: number;
  go: BriefGo;
}

export interface BriefInput {
  now: number;
  /** detections newer than the previous visit (countFreshFires); 0 the first time, when there is nothing to compare with */
  newFires: number;
  earlyPending: number;
  unackedRules: number;
  zonesWithFire: number;
  /** ms epoch of the newest detection, 0 when unknown */
  lastDetection: number;
  sources: readonly SourceStatus[];
  firesError: string | null;
}

/** ms epoch (UTC) of a detection from its day index and hhmm. */
export function firePointMs(p: FirePoint, days: readonly string[]): number {
  const day = days[p[4]];
  if (!day) return 0;
  const hhmm = String(p[5]).padStart(4, "0");
  const ms = Date.parse(`${day}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}:00Z`);
  return Number.isFinite(ms) ? ms : 0;
}

/** How many detections are newer than the previous visit (0 on a first visit). */
export function countFreshFires(fires: readonly FirePoint[], days: readonly string[], since: number | null): number {
  if (since === null) return 0;
  let n = 0;
  for (const p of fires) if (firePointMs(p, days) > since) n++;
  return n;
}

export function buildBrief(i: BriefInput): BriefItem[] {
  const out: BriefItem[] = [];
  if (i.firesError) out.push({ kind: "error", n: 1, go: "retry" });
  if (i.zonesWithFire > 0)
    out.push({ kind: "zones", n: i.zonesWithFire, go: "zonas" });
  if (i.unackedRules > 0)
    out.push({ kind: "rules", n: i.unackedRules, go: "alerts" });
  if (i.earlyPending > 0)
    out.push({ kind: "early", n: i.earlyPending, go: "alerts" });
  const down = i.sources.filter((s) => !s.ok).length;
  if (down > 0) out.push({ kind: "down", n: down, go: "sources" });
  if (i.lastDetection > 0 && i.now - i.lastDetection > STALE_MIN * 60_000)
    out.push({
      kind: "stale",
      n: Math.round((i.now - i.lastDetection) / 60_000),
      go: "sources",
    });
  if (i.newFires > 0) out.push({ kind: "fires", n: i.newFires, go: "incendios" });
  return out;
}
