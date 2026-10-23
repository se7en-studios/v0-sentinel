import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { translate } from "@/lib/admin/i18n";
import { alongRoute, distKm } from "@/lib/admin/geo";
import {
  UNITS,
  etaFromBase,
  unitState,
  type Dispatch,
  type OpsEntry,
} from "@/lib/admin/resources";
import { FLEET, droneTelemetry, sensorReading } from "@/lib/admin/sim";
import {
  MODE_ROLE,
  type FirePoint,
  type FiresPayload,
  type Region,
  type Settings,
  type Workspace,
} from "@/lib/admin/types";
import type { DroneState, SensorState } from "../ctx";
import { pointTs } from "./fire-time";

const MAX_LOG = 40;

interface Params {
  ws: Workspace;
  payload: FiresPayload | null;
  allFires: FirePoint[];
  region: Region;
  thresholds: Settings["thresholds"];
  now: number;
  nowStep: number;
  setOps: (f: (o: Workspace["ops"]) => Workspace["ops"]) => void;
}

/** Simulated drones, sensors and response units, plus the dispatch orders and operations log. */
export function useSimulation({
  ws,
  payload,
  allFires,
  region,
  thresholds,
  now,
  nowStep,
  setOps,
}: Params) {
  const [rtb, setRtb] = useState<Set<string>>(new Set());
  const [activeDrone, setActiveDrone] = useState<string | null>(null);

  const orders = ws.ops.orders;
  const setOrders = useCallback(
    (f: (o: Record<string, Dispatch>) => Record<string, Dispatch>) =>
      setOps((o) => ({ ...o, orders: f(o.orders) })),
    [setOps],
  );
  const ordersRef = useRef(orders);
  // eslint-disable-next-line react-hooks/refs -- the ref mirrors the latest orders for recallUnit
  ordersRef.current = orders;
  const opsLog = ws.ops.log;
  const setOpsLog = useCallback(
    (f: (l: OpsEntry[]) => OpsEntry[]) =>
      setOps((o) => ({ ...o, log: f(o.log) })),
    [setOps],
  );

  const toggleRtb = useCallback(
    (id: string) =>
      setRtb((cur) => {
        const n = new Set(cur);
        if (n.has(id)) n.delete(id);
        else n.add(id);
        return n;
      }),
    [],
  );

  const drones = useMemo<DroneState[]>(
    () =>
      FLEET.map((spec) => {
        const route = ws.features.find(
          (f) =>
            MODE_ROLE[String(f.properties.mode)] === "route" &&
            ws.meta[f.id]?.droneId === spec.id,
        );
        const telem = droneTelemetry(spec, now);
        return {
          spec,
          route,
          telem,
          track:
            route && !rtb.has(spec.id) ? alongRoute(route, telem.distKm) : null,
        };
      }),
    [ws.features, ws.meta, now, rtb],
  );

  const recentFires = useMemo(() => {
    if (!payload) return [];
    const since = nowStep * 600_000 - 24 * 3600_000;
    return allFires.filter(
      (p) => p[3] >= 1 && pointTs(payload.days, p) >= since,
    );
  }, [allFires, payload, nowStep]);
  const sensors = useMemo<SensorState[]>(
    () =>
      ws.features
        .filter((f) => MODE_ROLE[String(f.properties.mode)] === "sensor")
        .map((feat) => {
          const [lng, lat] = feat.geometry.coordinates as [number, number];
          let fireKm: number | null = null;
          for (const p of recentFires) {
            if (Math.abs(p[0] - lat) > 0.2 || Math.abs(p[1] - lng) > 0.25)
              continue;
            const d = distKm([lng, lat], [p[1], p[0]]);
            if (fireKm === null || d < fireKm) fireKm = d;
          }
          const meta = ws.meta[feat.id] ?? { name: feat.id };
          const type = meta.sensorType ?? "temp";
          return {
            feat,
            meta,
            type,
            fireKm,
            reading: sensorReading(feat.id, type, now, fireKm, thresholds),
          };
        }),
    [ws.features, ws.meta, recentFires, now, thresholds],
  );

  const units = useMemo(
    () => UNITS.map((u) => unitState(u, region.center, orders[u.id], now)),
    [region, orders, now],
  );
  const locale = ws.settings.locale;
  const dispatchUnit = useCallback(
    (id: string, target: [number, number], label: string) => {
      const spec = UNITS.find((u) => u.id === id);
      if (!spec) return;
      const t = Date.now();
      setOrders((o) => ({ ...o, [id]: { target, label, since: t } }));
      const eta = etaFromBase(spec, region.center, target);
      setOpsLog((l) =>
        [
          {
            id: `${id}-${t}`,
            t,
            text: translate(locale, "op.sent", { name: spec.name, label, eta }),
          },
          ...l,
        ].slice(0, MAX_LOG),
      );
      toast.success(translate(locale, "op.sentToast", { name: spec.name }), {
        description: translate(locale, "op.sentDesc", { label, eta }),
      });
    },
    [region, setOrders, setOpsLog, locale],
  );
  const recallUnit = useCallback(
    (id: string) => {
      const t = Date.now();
      if (ordersRef.current[id]?.recalledAt || !ordersRef.current[id]) return;
      setOrders((o) =>
        o[id] && !o[id].recalledAt
          ? { ...o, [id]: { ...o[id], recalledAt: t } }
          : o,
      );
      const spec = UNITS.find((u) => u.id === id);
      if (spec)
        setOpsLog((l) =>
          [
            { id: `${id}-r-${t}`, t, text: translate(locale, "op.back", { name: spec.name }) },
            ...l,
          ].slice(0, MAX_LOG),
        );
    },
    [setOrders, setOpsLog, locale],
  );
  const unitMarkers = useMemo(
    () =>
      units
        .filter((u) => u.status !== "disponible")
        .map((u) => ({
          id: u.spec.id,
          name: u.spec.name,
          kind: u.spec.kind,
          pos: u.pos,
        })),
    [units],
  );

  return {
    rtb,
    toggleRtb,
    activeDrone,
    setActiveDrone,
    drones,
    sensors,
    units,
    dispatchUnit,
    recallUnit,
    unitMarkers,
    opsLog,
  };
}

/** Marker and 3D-follow data derived from the simulated drones. */
export function droneView(
  drones: DroneState[],
  followId: string | null,
  view: "2d" | "3d",
  selectedId: string | null,
) {
  const followed = followId
    ? drones.find((d) => d.spec.id === followId)
    : undefined;
  const followDrone =
    followed?.track && view === "3d"
      ? { pos: followed.track.pos, heading: followed.track.heading }
      : null;
  const droneMarkers = drones
    .filter((d) => d.track)
    .map((d) => ({
      id: d.spec.id,
      name: d.spec.name,
      pos: d.track!.pos,
      heading: d.track!.heading,
      selected: d.route?.id === selectedId,
      altitude: d.telem.altitude,
    }));
  return { followDrone, droneMarkers };
}
