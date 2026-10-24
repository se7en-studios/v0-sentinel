import type { Translate } from "@/lib/admin/i18n";

// Every formatter takes the BCP 47 tag of the interface language (NUM_LOCALE in
// lib/admin/i18n-shell.ts); without one it keeps the original Argentine Spanish.
const TZ = "America/Argentina/Buenos_Aires";
const ES = "es-AR";

interface Intls {
  day: Intl.DateTimeFormat;
  time: Intl.DateTimeFormat;
  long: Intl.DateTimeFormat;
  n0: Intl.NumberFormat;
  n1: Intl.NumberFormat;
  n2: Intl.NumberFormat;
  k: Intl.NumberFormat;
}

const cache = new Map<string, Intls>();
function intl(loc: string): Intls {
  let f = cache.get(loc);
  if (!f) {
    f = {
      day: new Intl.DateTimeFormat(loc, {
        timeZone: TZ,
        day: "numeric",
        month: "short",
      }),
      // h23: en-US with hour12:false would print midnight as "24:05"
      time: new Intl.DateTimeFormat(loc, {
        timeZone: TZ,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }),
      long: new Intl.DateTimeFormat(loc, {
        timeZone: TZ,
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      n0: new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }),
      n1: new Intl.NumberFormat(loc, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }),
      n2: new Intl.NumberFormat(loc, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }),
      k: new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }),
    };
    cache.set(loc, f);
  }
  return f;
}

// es-AR gives "5-ene" / "5 de ene."; pt-BR "5 de jan."; we want "5 ene" / "5 jan"
const clean = (s: string) =>
  s
    .replace(/\./g, "")
    .replace(/\s+de\s+/g, " ")
    .replace(/(\d)-(\p{L})/u, "$1 $2");

/** "10 ene" */
export const fmtDay = (t: number, loc = ES) => clean(intl(loc).day.format(t));
/** "01:38" */
export const fmtTime = (t: number, loc = ES) => intl(loc).time.format(t);
/** "10 ene, 01:38" */
export const fmtDayTime = (t: number, loc = ES) =>
  `${fmtDay(t, loc)}, ${fmtTime(t, loc)}`;
/** "sáb 10 ene 2026" */
export const fmtLong = (t: number, loc = ES) => clean(intl(loc).long.format(t));

export const fmtInt = (v: number, loc = ES) => intl(loc).n0.format(v);
export const fmt1 = (v: number, loc = ES) => intl(loc).n1.format(v);
export const fmt2 = (v: number, loc = ES) => intl(loc).n2.format(v);
export const fmtHa = (v: number, loc = ES) =>
  `${intl(loc).n0.format(Math.round(v))} ha`;
/** m/h → "0,8 km/h" above 100 m/h, else "65 m/h" */
export const fmtRos = (mh: number, loc = ES) =>
  mh >= 100
    ? `${intl(loc)
        .n1.format(mh / 1000)
        .replace(/[.,]0$/, "")} km/h`
    : `${intl(loc).n0.format(mh)} m/h`;
export const fmtKm = (km: number, loc = ES) =>
  `${km >= 10 ? intl(loc).n0.format(km) : intl(loc).n1.format(km)} km`;
/** Chart axis tick: 800, 1,6k, 2,4k, 12k (one decimal below 10k, or 1600 and 2400 both read "2k"). */
export const fmtTick = (v: number, loc = ES) =>
  v >= 10_000
    ? `${Math.round(v / 1000)}k`
    : v >= 1000
      ? `${intl(loc).k.format(v / 1000)}k`
      : String(Math.round(v));

const SAT_LABEL: Record<string, string> = {
  N: "S-NPP",
  N20: "NOAA-20",
  N21: "NOAA-21",
};
export const satLabel = (s: string) => SAT_LABEL[s] ?? s;

/** "pasadas diurnas" / "pasadas nocturnas" for a FEDS half-day step. */
export const halfLabel = (tr: Translate, half: "AM" | "PM") =>
  tr(half === "PM" ? "trk.half.PM" : "trk.half.AM");

const DIRS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;
type Dir = (typeof DIRS)[number];
const isDir = (d: string): d is Dir => (DIRS as readonly string[]).includes(d);
export const dirLong = (tr: Translate, d: string) =>
  isDir(d) ? tr(`trk.dir.${d}`) : d;
/** "NO" → "NW" in English: the compass letters follow the language. */
export const dirShort = (tr: Translate, d: string) =>
  isDir(d) ? tr(`trk.dirS.${d}`) : d;

/** Compass code (Spanish letters, the data's own) for a "from" wind direction in degrees. */
export function windFrom(deg: number) {
  return DIRS[Math.round(deg / 45) % 8];
}

/** {n} foco / focos, with the number formatted for the language. */
export const focos = (tr: Translate, n: number, loc = ES) =>
  tr(n === 1 ? "trk.foci.one" : "trk.foci.other", { n: fmtInt(n, loc) });

const PLACE = /^(?:en|a (\d+) km de) ([\s\S]*)$/;
/** Re-renders lib/places' Spanish "en X" / "a 12 km de X (Prov)" label in the interface language. */
export function placeName(tr: Translate, name: string) {
  const m = PLACE.exec(name);
  if (!m) return name;
  return m[1]
    ? tr("trk.place.near", { km: m[1], name: m[2] })
    : tr("trk.place.at", { name: m[2] });
}
