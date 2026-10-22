import { parseFirmsGoes, SCAN_MS } from "@/lib/admin/early";
import { parseFireRows } from "@/lib/admin/fires-parse";
import { tileNames } from "@/lib/admin/terrain";
import { AR_BBOX } from "./argentina";
import { stamp } from "./early-sources";

export interface HealthSource {
  id: string;
  label: string;
  ok: boolean;
  /** ms the probe took (also set on failures, up to the timeout) */
  latencyMs: number;
  /** ms epoch of the newest data point the source showed */
  newestAt?: number;
  /** minutes between `now` and `newestAt` */
  ageMin?: number;
  error?: string;
}

export interface HealthPayload {
  updated: string;
  ok: boolean;
  sources: HealthSource[];
}

export const PROBE_TIMEOUT_MS = 6000;
const FIRMS = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
const INPE =
  "https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/10min";

type Probe = () => Promise<{ newestAt?: number }>;

const newest = (ats: number[]) => (ats.length ? Math.max(...ats) : undefined);

/** Runs one probe with its own deadline. Error text is fixed per failure kind: never a URL (keys live there). */
async function run(
  id: string,
  label: string,
  now: number,
  probe: Probe,
): Promise<HealthSource> {
  const t0 = Date.now();
  try {
    const { newestAt } = await Promise.race([
      probe(),
      new Promise<never>((_, rej) =>
        setTimeout(
          () => rej(new Error("Sin respuesta a tiempo")),
          PROBE_TIMEOUT_MS + 500,
        ),
      ),
    ]);
    return {
      id,
      label,
      ok: true,
      latencyMs: Date.now() - t0,
      ...(newestAt && {
        newestAt,
        ageMin: Math.max(0, Math.round((now - newestAt) / 60_000)),
      }),
    };
  } catch (e) {
    const known = e instanceof Error && e.message.startsWith("Sin ");
    return {
      id,
      label,
      ok: false,
      latencyMs: Date.now() - t0,
      error: known ? e.message : "No se pudo contactar a la fuente",
    };
  }
}

const get = async (url: string, method = "GET") => {
  const res = await fetch(url, {
    method,
    cache: "no-store",
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Sin datos (HTTP ${res.status})`);
  return res;
};

const firmsCsv = async (key: string, source: string) => {
  const text = await (
    await get(`${FIRMS}/${key}/${source}/${AR_BBOX}/1`)
  ).text();
  if (!text.startsWith("latitude")) throw new Error("Sin datos válidos");
  return text;
};

/** One probe per source the panel depends on; FIRMS ones are skipped with a clear message if no key. */
export async function checkHealth(
  now: number,
  key: string | undefined,
): Promise<HealthPayload> {
  const noKey: Probe = async () => {
    throw new Error("Sin clave: falta NASA_FIRMS_KEY en el servidor");
  };
  const firms = (src: string, parse: (csv: string) => number[]): Probe =>
    key
      ? async () => ({ newestAt: newest(parse(await firmsCsv(key, src))) })
      : noKey;
  const viirsAt = (csv: string) => parseFireRows(csv, "viirs").map((r) => r.at);
  const latest = Math.floor(now / SCAN_MS) * SCAN_MS;
  const inpe: Probe = async () => {
    // the newest file may not be published yet: accept either of the last two
    for (const k of [0, 1]) {
      const at = latest - k * SCAN_MS;
      const r = await fetch(`${INPE}/focos_10min_${stamp(at)}.csv`, {
        method: "HEAD",
        cache: "no-store",
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      }).catch(() => null);
      if (r?.ok) return { newestAt: at };
    }
    throw new Error("Sin archivos recientes");
  };
  const aws: Probe = async () => {
    await get(tileNames(-34.6, -58.4).demUrl, "HEAD");
    return {};
  };
  const sources = await Promise.all([
    run(
      "firms-viirs",
      "NASA FIRMS · VIIRS (NOAA-20/21)",
      now,
      firms("VIIRS_NOAA20_NRT", viirsAt),
    ),
    run(
      "firms-modis",
      "NASA FIRMS · MODIS (Terra/Aqua)",
      now,
      firms("MODIS_NRT", (c) => parseFireRows(c, "modis").map((r) => r.at)),
    ),
    run(
      "firms-goes",
      "NASA FIRMS · GOES-19",
      now,
      firms("GOES_NRT", (c) => parseFirmsGoes(c).map((r) => r.at)),
    ),
    run("inpe", "INPE · archivos de 10 min", now, inpe),
    run("aws-terrain", "AWS · terreno (Copernicus DEM)", now, aws),
  ]);
  return {
    updated: new Date(now).toISOString(),
    ok: sources.every((s) => s.ok),
    sources,
  };
}
