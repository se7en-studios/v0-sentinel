import { satCode } from "./fire-sources";
import type { FirePoint } from "./types";

/** One detection from a FIRMS CSV, before it is packed into a FirePoint. */
export interface FireRow {
  lat: number;
  lng: number;
  date: string;
  /** acq_time hhmm UTC, as in the CSV */
  time: number;
  /** ms epoch (UTC) */
  at: number;
  frp: number;
  /** 0 low, 1 nominal, 2 high */
  conf: 0 | 1 | 2;
  night: boolean;
  sat?: number;
}

const VIIRS_CONF: Record<string, 0 | 1 | 2> = { l: 0, n: 1, h: 2 };

/** MODIS reports 0-100: its own low/nominal/high bands are <30, 30-79 and >=80. */
const modisConf = (v: string): 0 | 1 | 2 => {
  const n = parseFloat(v);
  return n >= 80 ? 2 : n >= 30 ? 1 : 0;
};

/** FIRMS CSV rows for one product family (VIIRS has l/n/h confidence, MODIS a 0-100 number). */
export function parseFireRows(csv: string, kind: "viirs" | "modis"): FireRow[] {
  const [head, ...rows] = csv.trim().split("\n");
  if (!head) return [];
  const cols = head.split(",").map((c) => c.trim());
  const [iLat, iLng, iDate, iTime, iConf, iFrp, iDn, iSat] = [
    "latitude",
    "longitude",
    "acq_date",
    "acq_time",
    "confidence",
    "frp",
    "daynight",
    "satellite",
  ].map((n) => cols.indexOf(n));
  if ([iLat, iLng, iDate, iTime, iConf].includes(-1)) return [];
  const out: FireRow[] = [];
  for (const row of rows) {
    const c = row.split(",");
    const lat = parseFloat(c[iLat]);
    const lng = parseFloat(c[iLng]);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const time = parseInt(c[iTime], 10) || 0;
    const hhmm = String(time).padStart(4, "0");
    const at = Date.parse(
      `${c[iDate]}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}:00Z`,
    );
    if (!Number.isFinite(at)) continue;
    out.push({
      lat,
      lng,
      date: c[iDate],
      time,
      at,
      frp: parseFloat(c[iFrp]) || 0,
      conf:
        kind === "modis" ? modisConf(c[iConf]) : (VIIRS_CONF[c[iConf]] ?? 1),
      night: c[iDn] === "N",
      sat: satCode(iSat === -1 ? undefined : c[iSat]?.trim()),
    });
  }
  return out;
}

const KM_LAT = 111.32;
const CELL = 0.02;
const MODIS_DUP_M = 1000;
const MODIS_DUP_MS = 60 * 60_000;

/**
 * MODIS rows VIIRS already reported: same ~1 km spot within an hour (Aqua flies with NOAA-20,
 * so most of its detections repeat). Terra crosses about three hours earlier, so what it sees
 * stays: it is the earlier sighting of the same fire.
 */
export function dropModisDuplicates(
  modis: FireRow[],
  viirs: FireRow[],
): FireRow[] {
  const grid = new Map<string, FireRow[]>();
  for (const v of viirs) {
    const k = `${Math.floor(v.lat / CELL)}|${Math.floor(v.lng / CELL)}`;
    (grid.get(k) ?? grid.set(k, []).get(k)!).push(v);
  }
  return modis.filter((m) => {
    const i = Math.floor(m.lat / CELL);
    const j = Math.floor(m.lng / CELL);
    const cos = Math.cos((m.lat * Math.PI) / 180);
    for (let di = -1; di <= 1; di++)
      for (let dj = -1; dj <= 1; dj++)
        for (const v of grid.get(`${i + di}|${j + dj}`) ?? []) {
          if (Math.abs(v.at - m.at) > MODIS_DUP_MS) continue;
          const dy = (v.lat - m.lat) * KM_LAT * 1000;
          const dx = (v.lng - m.lng) * KM_LAT * 1000 * cos;
          if (dx * dx + dy * dy <= MODIS_DUP_M * MODIS_DUP_M) return false;
        }
    return true;
  });
}

/** Rows to the FirePoint tuples the panel works with, plus the sorted day list their index points into. */
export function packPoints(rows: FireRow[]): {
  days: string[];
  points: FirePoint[];
  newestAt: number;
} {
  const days = [...new Set(rows.map((r) => r.date))].sort();
  let newestAt = 0;
  const points = rows.map<FirePoint>((r) => {
    newestAt = Math.max(newestAt, r.at);
    const p: FirePoint = [
      Math.round(r.lat * 1e4) / 1e4,
      Math.round(r.lng * 1e4) / 1e4,
      r.frp,
      r.conf,
      days.indexOf(r.date),
      r.time,
      r.night ? 1 : 0,
    ];
    if (r.sat !== undefined) p[7] = r.sat;
    return p;
  });
  return { days, points, newestAt };
}
