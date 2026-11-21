// Server-side watch: fresh fires near people, announced without any panel open
// (GET /api/cron/watch, called every few hours by .github/workflows/vigia.yml).
// Pure pieces here so they can be tested without FIRMS or a mail provider.

import { createHash, timingSafeEqual } from "node:crypto";
import { clusterDetections } from "@/lib/admin/cluster";
import type { FireRow } from "@/lib/admin/fires-parse";
import { packPoints } from "@/lib/admin/fires-parse";
import { classifyPoints } from "@/lib/admin/noise";
import type { LandCover } from "@/lib/engine/track";
import { roundPeople, type PeopleNear } from "@/lib/admin/population";
import type { FireCluster } from "@/lib/admin/types";

export interface WatchConfig {
  /** only detections acquired this recently count as new (match the schedule) */
  windowMs: number;
  /** people within 10 km from which a fire is worth a message */
  minPeople: number;
}

const DEFAULT_WINDOW_MIN = 180;
const DEFAULT_MIN_PEOPLE = 1000;
const MAX_LISTED = 5;
const MESSAGE_MAX = 1000;

const posInt = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

export function watchConfig(
  env: Record<string, string | undefined>,
): WatchConfig {
  return {
    windowMs: posInt(env.WATCH_WINDOW_MIN, DEFAULT_WINDOW_MIN) * 60_000,
    minPeople: posInt(env.WATCH_MIN_PEOPLE, DEFAULT_MIN_PEOPLE),
  };
}

/** Bearer token check in constant time; no secret configured means the route is closed. */
export function cronAuthorized(
  header: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  // hash both sides so the comparison never leaks the secret's length
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(header.slice(7)), h(secret));
}

export type ExposedCluster = FireCluster & { people: PeopleNear };

/**
 * WorldCover group under a point. Only urban ground is dropped: the "otro" group mixes water and snow
 * with wetland, and wetland fires (Paraná Delta islands, Iberá) are some of the worst near people.
 */
export type CoverAt = (lat: number, lng: number) => LandCover | undefined;
const NON_VEGETATION: ReadonlySet<LandCover> = new Set(["urbano"]);

/**
 * New detections grouped into fires and kept when enough people live nearby, most exposed first.
 * `rows` should span several days: the panel's classifier needs that history to recognise fixed
 * heat (flares, kilns, smelters) that returns every day. Dropped before grouping: low confidence,
 * industrial or fixed heat, and detections over urban ground (a hot roof in a city is not a
 * wildfire, and it is where the most people live).
 * ponytail: stateless window, no record of what was already sent. A detection that reaches FIRMS
 * later than `windowMs` after its pass is never announced, and overlapping runs would repeat.
 * Add a seen-set (Firestore or KV) to widen the window without repeats.
 */
export function exposedFires(
  rows: FireRow[],
  now: number,
  cfg: WatchConfig,
  people: (lat: number, lng: number) => PeopleNear | null,
  cover: CoverAt = () => undefined,
): ExposedCluster[] {
  const { points } = packPoints(rows);
  const { reason } = classifyPoints(points);
  const fresh = points.filter((p, i) => {
    const r = rows[i];
    if (r.conf === 0 || reason[i] || r.at > now || now - r.at > cfg.windowMs) return false;
    const g = cover(p[0], p[1]);
    return !g || !NON_VEGETATION.has(g);
  });
  if (fresh.length === 0) return [];
  // a single detection next to a town matters here, unlike the panel's top-8 list
  const out: ExposedCluster[] = [];
  for (const c of clusterDetections(fresh, { limit: 50, minPoints: 1 })) {
    const p = people(c.lat, c.lng);
    if (p && p.km10 >= cfg.minPeople) out.push({ ...c, people: p });
  }
  return out.sort(
    (a, b) => b.people.km5 - a.people.km5 || b.people.km10 - a.people.km10,
  );
}

const fmt = (n: number) => roundPeople(n).toLocaleString("es-AR");

/** One notice for all of them: what happened, where, and how many people live around each. */
export function watchMessage(fires: ExposedCluster[]): {
  title: string;
  message: string;
} {
  const n = fires.length;
  const title =
    n === 1
      ? "Sentinel: foco nuevo cerca de población"
      : `Sentinel: ${n} focos nuevos cerca de población`;
  const lines = fires
    .slice(0, MAX_LISTED)
    .map(
      (f) =>
        `• ${f.km} km de ${f.near}: ${f.count} ${f.count === 1 ? "detección" : "detecciones"}, ` +
        `≈ ${fmt(f.people.km5)} personas a 5 km (≈ ${fmt(f.people.km10)} a 10 km). ` +
        `${f.lat.toFixed(3)}, ${f.lng.toFixed(3)}`,
    );
  if (n > MAX_LISTED) lines.push(`y ${n - MAX_LISTED} más en el panel.`);
  lines.push(
    "Satélite (NASA FIRMS), sin confirmar en terreno. Población estimada (WorldPop 2020).",
  );
  return { title, message: lines.join("\n").slice(0, MESSAGE_MAX) };
}
