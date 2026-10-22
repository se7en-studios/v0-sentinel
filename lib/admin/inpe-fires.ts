import type { FireRow } from "./fires-parse";
import { FIRE_SATS, satCode } from "./fire-sources";
import type { SourceStatus } from "./types";

/** INPE satellite names to the panel's polar satellite ids (GOES/MSG are geostationary: not here). */
const INPE_SATS: [RegExp, string][] = [
  [/^NOAA-20/, "N20"],
  [/^NOAA-21/, "N21"],
  [/^NPP/, "N"],
  [/^AQUA/, "Aqua"],
  [/^TERRA/, "Terra"],
];

const toCode = (name: string) => {
  const id = INPE_SATS.find(([re]) => re.test(name.trim().toUpperCase()))?.[1];
  return id === undefined ? undefined : satCode(id);
};

/**
 * INPE CSV (daily `id,lat,lon,data_hora_gmt,satelite,...,frp` or 10-minute `lat,lon,satelite,data`),
 * read by header name. Keeps polar satellites only. INPE gives no confidence, so every row is
 * "nominal"; day/night is unknown and reported as day.
 */
export function parseInpePolar(csv: string): FireRow[] {
  const [head, ...rows] = csv.trim().split("\n");
  if (!head) return [];
  const cols = head.split(",").map((c) => c.trim());
  const idx = (...names: string[]) => cols.findIndex((c) => names.includes(c));
  const [iLat, iLng, iSat, iAt, iFrp] = [
    idx("lat"),
    idx("lon"),
    idx("satelite"),
    idx("data_hora_gmt", "data"),
    idx("frp"),
  ];
  if ([iLat, iLng, iSat, iAt].includes(-1)) return [];
  const out: FireRow[] = [];
  for (const row of rows) {
    const c = row.split(",");
    const sat = toCode(c[iSat] ?? "");
    if (sat === undefined) continue;
    const lat = parseFloat(c[iLat]);
    const lng = parseFloat(c[iLng]);
    const stamp = (c[iAt] ?? "").trim().replace(" ", "T");
    const at = Date.parse(`${stamp}Z`);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(at))
      continue;
    const iso = new Date(at).toISOString();
    out.push({
      lat,
      lng,
      date: iso.slice(0, 10),
      time: Number(iso.slice(11, 13)) * 100 + Number(iso.slice(14, 16)),
      at,
      frp: (iFrp === -1 ? 0 : parseFloat(c[iFrp])) || 0,
      conf: 1,
      night: false,
      sat,
    });
  }
  return out;
}

/** Per-satellite status for the INPE backup: ids `inpe-*` and a label that says it is a backup. */
export function inpeStatuses(rows: FireRow[], ok: boolean): SourceStatus[] {
  return FIRE_SATS.map((s) => {
    const mine = rows.filter((r) => r.sat === s.code);
    return {
      id: `inpe-${s.id.toLowerCase()}`,
      label: `${s.label} · ${s.sensor} · respaldo INPE`,
      ok,
      count: mine.length,
      ...(mine.length && { newestAt: Math.max(...mine.map((r) => r.at)) }),
    };
  });
}
