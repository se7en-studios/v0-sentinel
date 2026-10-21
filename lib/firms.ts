// Suomi NPP stops delivering data on 2026-11-01 13:00 UTC. NOAA-20 and NOAA-21
// carry the same VIIRS 375 m sensor ~50 min apart, so together they also catch
// short-lived burns a single pass misses: over Argentina, 1.4-2x the S-NPP
// detections after dedupe (measured Oct 2026).
export const FIRMS_SOURCES = ["VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"] as const;
export const FIRMS_LABEL = "VIIRS NOAA-20 + NOAA-21";

// Two satellites seeing the same pixel in the same day/night pass count once.
const DUP_M = 500;
const CELL = 0.005; // ~550 m, so a DUP_M radius only spans neighbouring cells

/**
 * Fetches every source and returns one CSV (shared header) with cross-satellite
 * duplicates removed, or null when no source answered with data. A source that
 * fails is skipped, so one satellite down still leaves the other.
 */
export async function fetchFirmsCsv(
  url: (source: string) => string,
  init?: RequestInit,
): Promise<string | null> {
  const texts = await Promise.all(
    FIRMS_SOURCES.map((s) =>
      fetch(url(s), init)
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => ""),
    ),
  );
  const csvs = texts.filter((t) => t.startsWith("latitude"));
  if (csvs.length === 0) return null;

  const [head] = csvs[0].trim().split("\n");
  const cols = head.split(",");
  const [iLat, iLng, iDate, iDn] = [
    "latitude",
    "longitude",
    "acq_date",
    "daynight",
  ].map((n) => cols.indexOf(n));

  const seen = new Map<string, [number, number][]>();
  const key = (r: string[], i: number, j: number) =>
    `${r[iDate]}|${r[iDn]}|${i}|${j}`;
  const out = [head];
  for (const csv of csvs) {
    const [h, ...rows] = csv.trim().split("\n");
    if (h !== head) continue;
    const added: [string, number, number][] = [];
    for (const row of rows) {
      const r = row.split(",");
      const lat = parseFloat(r[iLat]);
      const lng = parseFloat(r[iLng]);
      const i = Math.floor(lat / CELL);
      const j = Math.floor(lng / CELL);
      const cosLat = Math.cos((lat * Math.PI) / 180);
      let dup = false;
      for (let di = -1; di <= 1 && !dup; di++)
        for (let dj = -1; dj <= 1 && !dup; dj++)
          dup = (seen.get(key(r, i + di, j + dj)) ?? []).some(([qLat, qLng]) => {
            const dy = (lat - qLat) * 111_320;
            const dx = (lng - qLng) * 111_320 * cosLat;
            return dx * dx + dy * dy <= DUP_M * DUP_M;
          });
      if (dup) continue;
      out.push(row);
      added.push([key(r, i, j), lat, lng]);
    }
    // only compare against other satellites: one satellite's own neighbouring
    // pixels are distinct detections, as they were with S-NPP alone
    for (const [k, lat, lng] of added)
      (seen.get(k) ?? seen.set(k, []).get(k)!).push([lat, lng]);
  }
  return out.join("\n");
}
