import { fetchFirmsCsv } from "@/lib/firms";
import {
  isInArgentina,
  isReliable,
  parseFirmsCsv,
} from "@/lib/landing-data/firms";
// ponytail: Argentina bounding box (west,south,east,north) used only to limit
// the request; every row is then checked against the country polygon.
const ARG_BBOX = "-73,-55,-53,-21";
const CHUNK_DAYS = 5;
const WINDOW_DAYS = 90;

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// null = the chunk failed (not zero detections).
async function fetchChunkCount(
  key: string,
  startDate: string,
): Promise<number | null> {
  const csv = await fetchFirmsCsv(
    (source) =>
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${ARG_BBOX}/${CHUNK_DAYS}/${startDate}`,
    { next: { revalidate: 86400 } },
  );
  if (csv === null) return null;
  return parseFirmsCsv(csv).filter(
    (p) => isReliable(p) && isInArgentina(p.lat, p.lng),
  ).length;
}

export interface Impact {
  total: number;
  coveredDays: number;
  failedChunks: number;
  totalChunks: number;
  from: string;
  to: string;
  at: Date;
}

export async function fetchImpact(): Promise<Impact | null> {
  const key = process.env.NASA_FIRMS_KEY;
  if (!key) return null;

  const today = new Date();
  const starts: Date[] = [];
  for (let offset = WINDOW_DAYS; offset > 0; offset -= CHUNK_DAYS) {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    starts.push(d);
  }
  const counts = await Promise.all(
    starts.map((d) => fetchChunkCount(key, isoDate(d))),
  );
  const ok = counts.filter((n): n is number => n !== null);
  if (ok.length === 0) return null;

  const end = new Date(starts[starts.length - 1]);
  end.setDate(end.getDate() + CHUNK_DAYS - 1);
  return {
    total: ok.reduce((s, n) => s + n, 0),
    coveredDays: ok.length * CHUNK_DAYS,
    failedChunks: counts.length - ok.length,
    totalChunks: counts.length,
    from: isoDate(starts[0]),
    to: isoDate(end),
    at: new Date(),
  };
}
