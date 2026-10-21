import { distKm } from "./geo";

// ponytail: demo response assets. Sentinel does not operate fire crews; this
// models the "Resources" view of a command centre so a client can see how
// dispatch, ETA and coverage would read. Everything here is labelled simulado.

export type UnitKind =
  "brigada" | "autobomba" | "avion" | "helicoptero" | "cisterna";

export interface UnitSpec {
  id: string;
  name: string;
  kind: UnitKind;
  /** people on board */
  crew: number;
  /** water capacity in litres (0 for ground crews) */
  water: number;
  speedKmh: number;
  /** base offset from the region centre, km (east, north) */
  base: [number, number];
}

export const KIND_LABEL: Record<UnitKind, string> = {
  brigada: "Brigada",
  autobomba: "Autobomba",
  avion: "Avión hidrante",
  helicoptero: "Helicóptero",
  cisterna: "Cisterna",
};

export const UNITS: UnitSpec[] = [
  {
    id: "u1",
    name: "BR-1 Andina",
    kind: "brigada",
    crew: 12,
    water: 0,
    speedKmh: 45,
    base: [-9, 4],
  },
  {
    id: "u2",
    name: "BR-2 Cordillera",
    kind: "brigada",
    crew: 10,
    water: 0,
    speedKmh: 45,
    base: [11, -6],
  },
  {
    id: "u3",
    name: "AB-1",
    kind: "autobomba",
    crew: 4,
    water: 3000,
    speedKmh: 60,
    base: [-3, -9],
  },
  {
    id: "u4",
    name: "AB-2",
    kind: "autobomba",
    crew: 4,
    water: 3000,
    speedKmh: 60,
    base: [6, 8],
  },
  {
    id: "u5",
    name: "CT-1",
    kind: "cisterna",
    crew: 2,
    water: 12000,
    speedKmh: 55,
    base: [0, 0],
  },
  {
    id: "u6",
    name: "HE-1 Pehuén",
    kind: "helicoptero",
    crew: 3,
    water: 1500,
    speedKmh: 190,
    base: [-14, -2],
  },
  {
    id: "u7",
    name: "AH-1 Cóndor",
    kind: "avion",
    crew: 2,
    water: 3100,
    speedKmh: 330,
    base: [18, 10],
  },
  {
    id: "u8",
    name: "AH-2 Zorzal",
    kind: "avion",
    crew: 2,
    water: 3100,
    speedKmh: 330,
    base: [-20, 12],
  },
];

export interface Dispatch {
  target: [number, number];
  label: string;
  since: number;
  /** when set the unit is flying/driving back to base */
  recalledAt?: number;
}

export type UnitStatus =
  "disponible" | "en ruta" | "en operación" | "regresando";

export interface UnitState {
  spec: UnitSpec;
  base: [number, number];
  pos: [number, number];
  status: UnitStatus;
  etaMin: number | null;
  progress: number;
  target?: Dispatch;
}

export interface OpsEntry {
  id: string;
  t: number;
  text: string;
}

/** Dispatches and the operations log, kept with the workspace so a refresh does not erase the record. */
export interface OpsState {
  orders: Record<string, Dispatch>;
  log: OpsEntry[];
}

export const OPS_LOG_MAX = 40;
export const EMPTY_OPS: OpsState = { orders: {}, log: [] };

const isPoint = (t: unknown): t is [number, number] =>
  Array.isArray(t) && t.length === 2 && t.every((n) => Number.isFinite(n));

/** Untrusted stored ops (localStorage or cloud) to a safe OpsState; never throws. */
export function cleanOps(input: unknown): OpsState {
  const o = (input ?? {}) as { orders?: unknown; log?: unknown };
  const orders: Record<string, Dispatch> = {};
  if (o.orders && typeof o.orders === "object")
    for (const [id, d] of Object.entries(o.orders as Record<string, Dispatch>)) {
      if (!d || !isPoint(d.target) || typeof d.label !== "string" || !Number.isFinite(d.since))
        continue;
      orders[id] = {
        target: d.target,
        label: d.label.slice(0, 120),
        since: d.since,
        ...(Number.isFinite(d.recalledAt) ? { recalledAt: d.recalledAt } : {}),
      };
    }
  const log = Array.isArray(o.log)
    ? (o.log as OpsEntry[])
        .filter((e) => e && typeof e.id === "string" && Number.isFinite(e.t) && typeof e.text === "string")
        .map((e) => ({ id: e.id.slice(0, 60), t: e.t, text: e.text.slice(0, 200) }))
        .slice(0, OPS_LOG_MAX)
    : [];
  return { orders, log };
}

const KM_PER_DEG = 111;

export function unitBase(
  spec: UnitSpec,
  center: [number, number],
): [number, number] {
  const kmLng = KM_PER_DEG * Math.cos((center[1] * Math.PI) / 180);
  return [
    center[0] + spec.base[0] / kmLng,
    center[1] + spec.base[1] / KM_PER_DEG,
  ];
}

const lerp = (
  a: [number, number],
  b: [number, number],
  t: number,
): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Position and status of a unit given its dispatch order at time `now`. */
export function unitState(
  spec: UnitSpec,
  center: [number, number],
  order: Dispatch | undefined,
  now: number,
): UnitState {
  const base = unitBase(spec, center);
  if (!order)
    return {
      spec,
      base,
      pos: base,
      status: "disponible",
      etaMin: null,
      progress: 0,
    };
  const total = Math.max(0.2, distKm(base, order.target));
  const out = ((order.recalledAt ?? now) - order.since) / 3600_000; // hours en route
  const reached = Math.min(1, (out * spec.speedKmh) / total);
  if (order.recalledAt) {
    const back = (now - order.recalledAt) / 3600_000;
    const left = Math.max(0, reached - (back * spec.speedKmh) / total);
    if (left <= 0)
      return {
        spec,
        base,
        pos: base,
        status: "disponible",
        etaMin: null,
        progress: 0,
      };
    return {
      spec,
      base,
      pos: lerp(base, order.target, left),
      status: "regresando",
      etaMin: Math.round(((left * total) / spec.speedKmh) * 60),
      progress: left,
      target: order,
    };
  }
  if (reached >= 1)
    return {
      spec,
      base,
      pos: order.target,
      status: "en operación",
      etaMin: 0,
      progress: 1,
      target: order,
    };
  return {
    spec,
    base,
    pos: lerp(base, order.target, reached),
    status: "en ruta",
    etaMin: Math.max(
      1,
      Math.round((((1 - reached) * total) / spec.speedKmh) * 60),
    ),
    progress: reached,
    target: order,
  };
}

/** ETA in minutes from a unit's base to a target, for ranking who to send. */
export const etaFromBase = (
  spec: UnitSpec,
  center: [number, number],
  target: [number, number],
) =>
  Math.max(
    1,
    Math.round((distKm(unitBase(spec, center), target) / spec.speedKmh) * 60),
  );

export interface OpsPoint {
  t: number;
  people: number;
  water: number;
  lineKm: number;
}

/** Last 60 minutes of simulated operations, one point per minute. */
export function opsSeries(units: UnitState[], now: number): OpsPoint[] {
  const out: OpsPoint[] = [];
  for (let m = 59; m >= 0; m--) {
    const t = now - m * 60_000;
    let people = 0;
    let water = 0;
    let lineKm = 0;
    for (const u of units) {
      const o = u.target;
      if (!o) continue;
      const dist = Math.max(0.2, distKm(u.base, o.target));
      const arrive = o.since + (dist / u.spec.speedKmh) * 3600_000;
      const ends = o.recalledAt ?? Infinity;
      if (t >= o.since && t < ends) people += u.spec.crew;
      if (t > arrive && t < ends) {
        const mins = (t - arrive) / 60_000;
        water += u.spec.water * Math.floor(mins / 15);
        if (u.spec.kind === "brigada") lineKm += (u.spec.crew * 0.05 * mins) / 60;
      }
    }
    out.push({ t, people, water, lineKm: Math.round(lineKm * 100) / 100 });
  }
  return out;
}
