/**
 * When polar satellites fly over Argentina. VIIRS (NOAA-20 and NOAA-21) only covers the country in two
 * windows a day; the rest of the day an early GOES alert cannot be confirmed by anyone. Hours are
 * Argentina time (UTC-3, no daylight saving), as minutes after midnight.
 *
 * Measured from FIRMS acquisition times (VIIRS: 84 days, 935 ten-minute buckets with detections, none
 * between 04:00-13:00 or 17:00-00:00 ART; MODIS: 56 buckets over 15 days, a rough guide). The windows
 * are the hours where detections were seen, widened to the whole hour. They are a planning aid, not an
 * orbit prediction: the real pass moves a few minutes from day to day.
 */
export interface PassWindow {
  /** minutes after midnight ART, inclusive */
  from: number;
  /** minutes after midnight ART, exclusive */
  to: number;
}

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

export const VIIRS_WINDOWS: PassWindow[] = [
  { from: h(0, 30), to: h(4) },
  { from: h(13), to: h(17) },
];

/** Terra (about 10:30 and 22:30 local solar time) and Aqua (about 13:30 and 01:30): 1 km pixels. */
export const MODIS_WINDOWS: PassWindow[] = [
  { from: h(4), to: h(5, 30) },
  { from: h(9), to: h(10, 30) },
  { from: h(16), to: h(18) },
  { from: h(21), to: h(22, 30) },
];

const DAY = 1440;
const ART_OFFSET_MS = 3 * 3600_000;

/** Minute of the day in Argentina for an instant. */
export const artMinute = (ms: number) =>
  Math.floor(
    ((((ms - ART_OFFSET_MS) % 86_400_000) + 86_400_000) % 86_400_000) / 60_000,
  );

/** Sorted, merged windows for the satellites in use. */
export function passWindows(includeModis: boolean): PassWindow[] {
  const all = [...VIIRS_WINDOWS, ...(includeModis ? MODIS_WINDOWS : [])].sort(
    (a, b) => a.from - b.from,
  );
  const out: PassWindow[] = [];
  for (const w of all) {
    const last = out[out.length - 1];
    if (last && w.from <= last.to)
      out[out.length - 1] = { from: last.from, to: Math.max(last.to, w.to) };
    else out.push({ ...w });
  }
  return out;
}

export interface NextPass {
  /** a polar satellite is flying over the country right now */
  inWindow: boolean;
  /** minutes until the current window ends (in a window) or the next one starts */
  minutes: number;
  /** the window that is open now or comes next */
  window: PassWindow;
}

/** The open window, or the next one to open (it may be tomorrow's first). */
export function nextPass(nowMs: number, includeModis: boolean): NextPass {
  const windows = passWindows(includeModis);
  const m = artMinute(nowMs);
  const open = windows.find((w) => m >= w.from && m < w.to);
  if (open) return { inWindow: true, minutes: open.to - m, window: open };
  const next = windows.find((w) => w.from > m);
  if (next) return { inWindow: false, minutes: next.from - m, window: next };
  return {
    inWindow: false,
    minutes: DAY - m + windows[0].from,
    window: windows[0],
  };
}

/** "13:00" from minutes after midnight. */
export const clock = (min: number) =>
  `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
