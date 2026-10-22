/** What the panel raised during this session (toasts disappear in seconds; this keeps them). */
export type ActivityKind = "zone" | "rule" | "early" | "sensor";

export interface ActivityEntry {
  id: string;
  t: number;
  kind: ActivityKind;
  title: string;
  detail: string;
}

export const ACTIVITY_MAX = 50;
const KINDS: readonly string[] = ["zone", "rule", "early", "sensor"];

/** Newest first, bounded. An entry whose id is already there is ignored (a re-render must not duplicate it). */
export function addActivity(list: ActivityEntry[], e: ActivityEntry): ActivityEntry[] {
  if (list.some((x) => x.id === e.id)) return list;
  return [e, ...list].slice(0, ACTIVITY_MAX);
}

/** Untrusted sessionStorage content to a safe list; never throws. */
export function cleanActivity(input: unknown): ActivityEntry[] {
  if (!Array.isArray(input)) return [];
  const out: ActivityEntry[] = [];
  for (const v of input) {
    if (out.length >= ACTIVITY_MAX) break;
    if (!v || typeof v !== "object") continue;
    const { id, t, kind, title, detail } = v as Record<string, unknown>;
    if (typeof id !== "string" || !Number.isFinite(t) || typeof kind !== "string" || !KINDS.includes(kind))
      continue;
    out.push({
      id: id.slice(0, 80),
      t: Number(t),
      kind: kind as ActivityKind,
      title: typeof title === "string" ? title.slice(0, 120) : "",
      detail: typeof detail === "string" ? detail.slice(0, 240) : "",
    });
  }
  return out;
}
