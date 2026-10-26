import { fetchFirmsCsv } from "@/lib/firms";
import {
  isInArgentina,
  isReliable,
  parseFirmsCsv,
  withinHours,
  type FirePoint,
} from "@/lib/landing-data/firms";
// Licensing note (team decision, not made here): NASA FIRMS data is open but
// asks for acknowledgement (done below). Keep the source link visible.

// ponytail: Latin America bounding box (west,south,east,north) — Mexico's
// northern border down to Cape Horn, wide enough to cover every country in
// data/latam-countries.json.
const LATAM_BBOX = "-118,-56,-34,33";
// FIRMS day_range=1 is only the current UTC day. Ask for 2 days and keep the
// real rolling 24 h window ourselves.
const DAY_RANGE = 2;
const WINDOW_HOURS = 24;

export interface FiresResult {
  inArgentina: FirePoint[];
  elsewhere: FirePoint[];
  at: Date;
}

export async function fetchActiveFires(): Promise<FiresResult | null> {
  const key = process.env.NASA_FIRMS_KEY;
  if (!key) return null;

  const csv = await fetchFirmsCsv(
    (source) =>
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${source}/${LATAM_BBOX}/${DAY_RANGE}`,
    { next: { revalidate: 3600 } },
  );
  if (csv === null) return null;

  const at = new Date();
  const recent = withinHours(
    parseFirmsCsv(csv).filter(isReliable),
    WINDOW_HOURS,
    at.getTime(),
  );
  return {
    inArgentina: recent.filter((p) => isInArgentina(p.lat, p.lng)),
    elsewhere: recent.filter((p) => !isInArgentina(p.lat, p.lng)),
    at,
  };
}
