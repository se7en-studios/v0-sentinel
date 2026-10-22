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

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  detected: "Detectado",
  verified: "Verificado",
  in_control: "En control",
  contained: "Contenido",
  extinguished: "Extinguido",
  closed: "Cerrado",
  false_positive: "Falso positivo",
};

export interface IncidentMeta {
  status: IncidentStatus;
  assignee: string;
  /** who changed it last */
  by: string;
  /** ms epoch of the last change */
  t: number;
}

export type IncidentMetaMap = Record<string, IncidentMeta>;

export const INCIDENT_META_MAX = 300;
export const ASSIGNEE_MAX = 60;

const isStatus = (s: unknown): s is IncidentStatus =>
  typeof s === "string" && (INCIDENT_STATUSES as readonly string[]).includes(s);

/** Untrusted stored follow-ups to a safe map; unknown statuses and malformed rows are dropped. */
export function cleanIncidentMeta(input: unknown): IncidentMetaMap {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: IncidentMetaMap = {};
  for (const [id, v] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= INCIDENT_META_MAX) break;
    if (!v || typeof v !== "object") continue;
    const { status, assignee, by, t } = v as Record<string, unknown>;
    if (!isStatus(status) || !Number.isFinite(t)) continue;
    out[id.slice(0, 40)] = {
      status,
      assignee:
        typeof assignee === "string"
          ? assignee.trim().slice(0, ASSIGNEE_MAX)
          : "",
      by: typeof by === "string" ? by.slice(0, 120) : "",
      t: Number(t),
    };
  }
  return out;
}

/** A closed, extinguished or false-positive incident no longer needs attention. */
export const isOpenStatus = (s: IncidentStatus) =>
  s !== "closed" && s !== "extinguished" && s !== "false_positive";
