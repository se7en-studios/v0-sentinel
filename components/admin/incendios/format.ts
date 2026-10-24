const TZ = "America/Argentina/Buenos_Aires";

const dayFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const longFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" });

// es-AR gives "5-ene" / "5 de ene."; we want "5 ene"
const clean = (s: string) => s.replace(".", "").replace(/\s+de\s+/g, " ").replace(/(\d)-(\p{L})/u, "$1 $2");

/** "10 ene" */
export const fmtDay = (t: number) => clean(dayFmt.format(t));
/** "01:38" */
export const fmtTime = (t: number) => timeFmt.format(t);
/** "10 ene, 01:38" */
export const fmtDayTime = (t: number) => `${fmtDay(t)}, ${fmtTime(t)}`;
/** "sáb 10 ene 2026" */
export const fmtLong = (t: number) => clean(longFmt.format(t));

const nf0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
export const fmtInt = (v: number) => nf0.format(v);
export const fmt1 = (v: number) => nf1.format(v);
export const fmtHa = (v: number) => `${nf0.format(Math.round(v))} ha`;
/** m/h → "0,81 km/h" above 100 m/h, else "65 m/h" */
export const fmtRos = (mh: number) => (mh >= 100 ? `${nf1.format(mh / 1000).replace(/,0$/, "")} km/h` : `${nf0.format(mh)} m/h`);
export const fmtKm = (km: number) => `${km >= 10 ? nf0.format(km) : nf1.format(km)} km`;

const SAT_LABEL: Record<string, string> = { N: "S-NPP", N20: "NOAA-20", N21: "NOAA-21" };
export const satLabel = (s: string) => SAT_LABEL[s] ?? s;

/** "Pasada diurna" / "Pasada nocturna" for a FEDS half-day step. */
export const halfLabel = (half: "AM" | "PM") => (half === "PM" ? "pasadas diurnas" : "pasadas nocturnas");

const DIR_LONG: Record<string, string> = {
  N: "norte",
  NE: "noreste",
  E: "este",
  SE: "sudeste",
  S: "sur",
  SO: "sudoeste",
  O: "oeste",
  NO: "noroeste",
};
export const dirLong = (d: string) => DIR_LONG[d] ?? d;

/** Compass name for a "from" wind direction in degrees. */
export function windFrom(deg: number) {
  const names = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return names[Math.round(deg / 45) % 8];
}
