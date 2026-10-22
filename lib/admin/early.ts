import { INDUSTRIAL_SITES } from "./noise";

/**
 * Early warning from the geostationary GOES-19 imager: it sees Argentina every 10 minutes
 * (about 20 min of delay) while the polar satellites that confirm a fire pass a few times a
 * day. The pixels are ~2-4 km and noisier, so a detection is "early" until a polar pass
 * confirms it nearby, and is dropped when it sits on known industrial heat.
 */
export type EarlySource = "FIRMS" | "INPE";

export interface RawGoes {
  lat: number;
  lng: number;
  /** ms epoch (UTC) of the scan */
  at: number;
  /** MW, 0 when the product gives none */
  frp: number;
  src: EarlySource;
}

export interface EarlyDetection {
  lat: number;
  lng: number;
  /** strongest FRP seen at this spot, MW */
  frp: number;
  /** distinct 10-minute scans that saw it */
  scans: number;
  firstAt: number;
  lastAt: number;
  sources: EarlySource[];
}

export type EarlyStatus = "open" | "confirmed" | "noise";

export interface EarlyView extends EarlyDetection {
  status: EarlyStatus;
  /** when the polar detection that confirmed it was acquired */
  confirmedAt?: number;
  /** name of the industrial site, when status is noise */
  site?: string;
}

/** A polar detection, reduced to what confirming or discarding an early one needs. */
export interface PolarRef {
  lat: number;
  lng: number;
  at: number;
  /** the classifier judged it industrial or a fixed source */
  noise: boolean;
}

export const SCAN_MS = 600_000;
const MERGE_KM = 4.5;
const CONFIRM_KM = 4.5;
const NOISE_KM = 1.5;
/** a polar pass can only confirm what GOES saw at about the same time or earlier */
const CONFIRM_LEAD_MS = 30 * 60_000;
/** FIRMS raw GOES lists a pixel on every scan, flicker included: require persistence */
export const MIN_FIRMS_SCANS = 3;
export const EARLY_WINDOW_MS = 6 * 3600_000;
const MAX_EARLY = 300;
const KM_LAT = 111.32;

const km = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const dy = (aLat - bLat) * KM_LAT;
  const dx = (aLng - bLng) * KM_LAT * Math.cos((aLat * Math.PI) / 180);
  return Math.hypot(dx, dy);
};

const cols = (head: string) => head.split(",").map((c) => c.trim());

/** FIRMS GOES_NRT rows from GOES-19 (G19 mask product and G19FRP); Meteosat and the rest are noise here. */
export function parseFirmsGoes(csv: string): RawGoes[] {
  const [head, ...rows] = csv.trim().split("\n");
  if (!head) return [];
  const c = cols(head);
  const [iLat, iLng, iDate, iTime, iSat, iFrp] = [
    "latitude",
    "longitude",
    "acq_date",
    "acq_time",
    "satellite",
    "frp",
  ].map((n) => c.indexOf(n));
  if ([iLat, iLng, iDate, iTime, iSat].includes(-1)) return [];
  const out: RawGoes[] = [];
  for (const row of rows) {
    const r = row.split(",");
    if (r[iSat] !== "G19" && r[iSat] !== "G19FRP") continue;
    const lat = parseFloat(r[iLat]);
    const lng = parseFloat(r[iLng]);
    const hhmm = String(parseInt(r[iTime], 10) || 0).padStart(4, "0");
    const at = Date.parse(
      `${r[iDate]}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}:00Z`,
    );
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(at))
      continue;
    const frp = iFrp === -1 ? 0 : parseFloat(r[iFrp]);
    out.push({ lat, lng, at, frp: frp > 0 ? frp : 0, src: "FIRMS" });
  }
  return out;
}

/** INPE 10-minute file: `lat,lon,satelite,data`; only its GOES-19 rows (polar satellites come from FIRMS). */
export function parseInpeGoes(csv: string): RawGoes[] {
  const out: RawGoes[] = [];
  for (const row of csv.trim().split("\n")) {
    const r = row.split(",");
    if (r.length < 4 || r[2].trim() !== "GOES-19") continue;
    const lat = parseFloat(r[0]);
    const lng = parseFloat(r[1]);
    const at = Date.parse(`${r[3].trim().replace(" ", "T")}Z`);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(at))
      continue;
    out.push({ lat, lng, at, frp: 0, src: "INPE" });
  }
  return out;
}

interface Acc {
  lat: number;
  lng: number;
  frp: number;
  buckets: Set<number>;
  firstAt: number;
  lastAt: number;
  sources: Set<EarlySource>;
}

/**
 * Groups raw GOES rows into one detection per spot (single link within ~4.5 km, the first
 * scan fixes the position). A spot seen only by the raw FIRMS list must persist over
 * MIN_FIRMS_SCANS scans; INPE already filters its own, so one of its scans is enough.
 */
export function mergeEarly(
  raw: RawGoes[],
  now: number,
  windowMs = EARLY_WINDOW_MS,
): EarlyDetection[] {
  const live = raw
    .filter((r) => r.at >= now - windowMs && r.at <= now + SCAN_MS)
    .sort((a, b) => a.at - b.at);
  const groups: Acc[] = [];
  for (const r of live) {
    let g = groups.find((x) => km(r.lat, r.lng, x.lat, x.lng) <= MERGE_KM);
    if (!g) {
      g = {
        lat: r.lat,
        lng: r.lng,
        frp: 0,
        buckets: new Set(),
        firstAt: r.at,
        lastAt: r.at,
        sources: new Set(),
      };
      groups.push(g);
    }
    g.frp = Math.max(g.frp, r.frp);
    g.buckets.add(Math.floor(r.at / SCAN_MS));
    g.lastAt = Math.max(g.lastAt, r.at);
    g.sources.add(r.src);
  }
  return groups
    .filter((g) => g.sources.has("INPE") || g.buckets.size >= MIN_FIRMS_SCANS)
    .map<EarlyDetection>((g) => ({
      lat: Math.round(g.lat * 1e4) / 1e4,
      lng: Math.round(g.lng * 1e4) / 1e4,
      frp: Math.round(g.frp * 10) / 10,
      scans: g.buckets.size,
      firstAt: g.firstAt,
      lastAt: g.lastAt,
      sources: [...g.sources].sort(),
    }))
    .sort((a, b) => b.lastAt - a.lastAt)
    .slice(0, MAX_EARLY);
}

/**
 * Decides what each early detection is: industrial heat (known site, or on top of a polar
 * detection that already looks fixed), confirmed (a clean polar detection nearby at or after
 * the first scan) or still open, which is the one worth acting on.
 */
export function resolveEarly(
  early: EarlyDetection[],
  polar: PolarRef[],
): EarlyView[] {
  return early.map((e) => {
    const site = INDUSTRIAL_SITES.find(
      (s) => km(e.lat, e.lng, s.lat, s.lng) <= s.km + MERGE_KM / 2,
    );
    if (site) return { ...e, status: "noise", site: site.name };
    if (
      polar.some((p) => p.noise && km(e.lat, e.lng, p.lat, p.lng) <= NOISE_KM)
    )
      return { ...e, status: "noise", site: "Fuente de calor fija" };
    let confirmedAt: number | undefined;
    for (const p of polar) {
      if (p.noise || p.at < e.firstAt - CONFIRM_LEAD_MS) continue;
      if (km(e.lat, e.lng, p.lat, p.lng) > CONFIRM_KM) continue;
      if (confirmedAt === undefined || p.at < confirmedAt) confirmedAt = p.at;
    }
    return confirmedAt === undefined
      ? { ...e, status: "open" }
      : { ...e, status: "confirmed", confirmedAt };
  });
}
