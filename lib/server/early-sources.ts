import {
  parseFirmsGoes,
  parseInpeGoes,
  SCAN_MS,
  type RawGoes,
} from "@/lib/admin/early";
import { AR_BBOX } from "./argentina";

export interface GoesFeed {
  ok: boolean;
  rows: RawGoes[];
  error?: string;
}

const INPE_BASE =
  "https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/10min";
/** 4 h of INPE's 10-minute files: enough to see a fire start and watch it persist */
const INPE_FILES = 24;
const INPE_TIMEOUT_MS = 8000;

/** FIRMS lists GOES_NRT per scan, including Meteosat noise; parseFirmsGoes keeps GOES-19 only. */
export async function fetchFirmsGoes(key: string): Promise<GoesFeed> {
  try {
    const res = await fetch(
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/GOES_NRT/${AR_BBOX}/2`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(15_000) },
    );
    const text = res.ok ? await res.text() : "";
    if (!text.startsWith("latitude"))
      return { ok: false, rows: [], error: "NASA FIRMS no entregó datos GOES" };
    return { ok: true, rows: parseFirmsGoes(text) };
  } catch {
    return { ok: false, rows: [], error: "No se pudo contactar a NASA FIRMS" };
  }
}

export const stamp = (ms: number) => {
  const d = new Date(ms).toISOString();
  return `${d.slice(0, 4)}${d.slice(5, 7)}${d.slice(8, 10)}_${d.slice(11, 13)}${d.slice(14, 16)}`;
};

/**
 * INPE (Programa Queimadas) publishes one CSV every 10 minutes for South America; no key needed.
 * The newest file may not exist yet, so a missing file is skipped and only an empty hand fails.
 */
export async function fetchInpeGoes(now: number): Promise<GoesFeed> {
  const latest = Math.floor(now / SCAN_MS) * SCAN_MS;
  const texts = await Promise.all(
    Array.from({ length: INPE_FILES }, (_, k) =>
      fetch(`${INPE_BASE}/focos_10min_${stamp(latest - k * SCAN_MS)}.csv`, {
        // past files never change; only the freshest two are worth re-asking for
        next: { revalidate: k < 2 ? 120 : 3600 },
        signal: AbortSignal.timeout(INPE_TIMEOUT_MS),
      })
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => ""),
    ),
  );
  const files = texts.filter((t) => t.startsWith("lat"));
  if (files.length === 0)
    return { ok: false, rows: [], error: "INPE no entregó archivos" };
  return { ok: true, rows: files.flatMap(parseInpeGoes) };
}
