import type { Detection, Satellite } from "./types";

const SATELLITES = new Set<Satellite>(["N", "N20", "N21"]);

/**
 * Parses a FIRMS VIIRS CSV (NRT or SP). Drops rows FIRMS flags as volcanoes,
 * static industrial heat or offshore (`type` 1-3, only present in SP files).
 */
export function parseFirmsCsv(csv: string): Detection[] {
  const [head, ...lines] = csv.trim().split(/\r?\n/);
  if (!head?.startsWith("latitude")) return [];
  const cols = head.split(",");
  const ix = (n: string) => cols.indexOf(n);
  const i = {
    lat: ix("latitude"),
    lng: ix("longitude"),
    date: ix("acq_date"),
    time: ix("acq_time"),
    sat: ix("satellite"),
    conf: ix("confidence"),
    frp: ix("frp"),
    dn: ix("daynight"),
    scan: ix("scan"),
    track: ix("track"),
    type: ix("type"),
  };
  const out: Detection[] = [];
  for (const line of lines) {
    const v = line.split(",");
    if (i.type !== -1 && v[i.type] !== "0") continue;
    const sat = v[i.sat] as Satellite;
    const lat = parseFloat(v[i.lat]);
    const lng = parseFloat(v[i.lng]);
    if (!SATELLITES.has(sat) || Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const hhmm = v[i.time].padStart(4, "0");
    out.push({
      lat,
      lng,
      t: Date.parse(`${v[i.date]}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}:00Z`),
      sat,
      conf: (v[i.conf] as Detection["conf"]) ?? "n",
      frp: parseFloat(v[i.frp]) || 0,
      day: v[i.dn] !== "N",
      scan: parseFloat(v[i.scan]) || 0.375,
      track: parseFloat(v[i.track]) || 0.375,
    });
  }
  return out;
}
