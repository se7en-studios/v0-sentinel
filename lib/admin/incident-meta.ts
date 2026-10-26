/** Follow-up the team keeps on a detected incident, keyed by the incident's stable id. */
export const INCIDENT_STATUSES = [
  "detected",
  "verified",
  "in_control",
  "contained",
  "extinguished",
  "closed",
  "false_positive",
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

/** One change of status or assignee, kept as the incident's timeline. */
export interface IncidentChange {
  t: number;
  by: string;
  status: IncidentStatus;
  assignee: string;
}

export interface IncidentMeta {
  status: IncidentStatus;
  assignee: string;
  /** who changed it last */
  by: string;
  /** ms epoch of the last change */
  t: number;
  /** oldest first; bounded so the workspace stays small */
  history?: IncidentChange[];
}

export type IncidentMetaMap = Record<string, IncidentMeta>;

export const INCIDENT_META_MAX = 300;
export const ASSIGNEE_MAX = 60;
export const HISTORY_PER_INCIDENT = 12;
/** across all incidents: ~200 bytes each, so the history never gets near the workspace size limit */
export const HISTORY_TOTAL_MAX = 1200;

const cleanChange = (v: unknown): IncidentChange | null => {
  if (!v || typeof v !== "object") return null;
  const { t, by, status, assignee } = v as Record<string, unknown>;
  if (!isStatus(status) || !Number.isFinite(t)) return null;
  return {
    t: Number(t),
    by: typeof by === "string" ? by.slice(0, 120) : "",
    status,
    assignee:
      typeof assignee === "string" ? assignee.trim().slice(0, ASSIGNEE_MAX) : "",
  };
};

/** The follow-up after a change by `by` at `t`: new status/assignee, plus a timeline entry when something actually changed. */
export function applyIncidentChange(
  cur: IncidentMeta | undefined,
  patch: { status?: IncidentStatus; assignee?: string },
  by: string,
  t: number,
): IncidentMeta {
  const status = patch.status ?? cur?.status ?? "detected";
  const assignee = (patch.assignee ?? cur?.assignee ?? "")
    .trim()
    .slice(0, ASSIGNEE_MAX);
  const changed = !cur || cur.status !== status || cur.assignee !== assignee;
  const history = changed
    ? [...(cur?.history ?? []), { t, by: by.slice(0, 120), status, assignee }].slice(
        -HISTORY_PER_INCIDENT,
      )
    : cur?.history;
  return { status, assignee, by, t, ...(history ? { history } : {}) };
}

const isStatus = (s: unknown): s is IncidentStatus =>
  typeof s === "string" && (INCIDENT_STATUSES as readonly string[]).includes(s);

/** Untrusted stored follow-ups to a safe map; unknown statuses and malformed rows are dropped. */
export function cleanIncidentMeta(input: unknown): IncidentMetaMap {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: IncidentMetaMap = {};
  let used = 0;
  // most recently touched first, so when the caps bite it is the stale incidents that lose history
  const recency = (v: unknown) =>
    v && typeof v === "object" && Number.isFinite((v as { t?: unknown }).t)
      ? Number((v as { t: number }).t)
      : 0;
  const entries = Object.entries(input as Record<string, unknown>).sort(
    (a, b) => recency(b[1]) - recency(a[1]),
  );
  for (const [id, v] of entries) {
    if (Object.keys(out).length >= INCIDENT_META_MAX) break;
    if (!v || typeof v !== "object") continue;
    const { status, assignee, by, t, history } = v as Record<string, unknown>;
    if (!isStatus(status) || !Number.isFinite(t)) continue;
    const changes = Array.isArray(history)
      ? history
          .map(cleanChange)
          .filter((c): c is IncidentChange => c !== null)
          .slice(-HISTORY_PER_INCIDENT)
      : [];
    const room = Math.max(0, HISTORY_TOTAL_MAX - used);
    const kept = room === 0 ? [] : changes.slice(-room);
    used += kept.length;
    out[id.slice(0, 40)] = {
      status,
      assignee:
        typeof assignee === "string"
          ? assignee.trim().slice(0, ASSIGNEE_MAX)
          : "",
      by: typeof by === "string" ? by.slice(0, 120) : "",
      t: Number(t),
      ...(kept.length ? { history: kept } : {}),
    };
  }
  return out;
}

/** A closed, extinguished or false-positive incident no longer needs attention. */
export const isOpenStatus = (s: IncidentStatus) =>
  s !== "closed" && s !== "extinguished" && s !== "false_positive";
