import type { FirePoint } from "@/lib/admin/types";

export const ART_MS = 3 * 3600_000; // Argentina is UTC-3 all year

/** Daily series in Argentina time, gap-filled so a quiet day shows as 0 instead of vanishing. */
export function artPerDay(
  byDay: Map<string, { count: number; frp: number }>,
  firstDay: string | undefined,
) {
  const keys = [...byDay.keys()].sort();
  const start = Date.parse(`${keys[0] ?? firstDay ?? "1970-01-01"}T00:00:00Z`);
  const end = Date.parse(
    `${new Date(Date.now() - ART_MS).toISOString().slice(0, 10)}T00:00:00Z`,
  );
  const out: { day: string; label: string; count: number; frp: number }[] = [];
  for (let t = start; t <= Math.max(end, start); t += 864e5) {
    const day = new Date(t).toISOString().slice(0, 10);
    const e = byDay.get(day);
    out.push({
      day,
      label: `${day.slice(8)}/${day.slice(5, 7)}`,
      count: e?.count ?? 0,
      frp: Math.round(e?.frp ?? 0),
    });
  }
  return out;
}

export const pointTs = (days: string[], p: FirePoint) => {
  const hh = String(p[5]).padStart(4, "0");
  return Date.parse(`${days[p[4]]}T${hh.slice(0, 2)}:${hh.slice(2)}:00Z`);
};
