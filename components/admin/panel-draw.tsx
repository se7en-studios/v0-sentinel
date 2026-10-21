"use client";

import { useState } from "react";
import buffer from "@turf/buffer";
import circle from "@turf/circle";
import { Crosshair, Pencil, Trash2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { areaHa, centerOf, fmtArea, fmtKm, lengthKm, patrolRing, sweepPath } from "@/lib/admin/geo";
import { FLEET, sensorReading } from "@/lib/admin/sim";
import {
  MODE_ROLE,
  ROLE_COLOR,
  SENSOR_LABEL,
  type Feat,
  type Role,
  type SensorType,
} from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { Badge, Btn, Card, Field, Stat, inputCls } from "./ui";
import { ThermalCam } from "./thermal-cam";

const roleOf = (f: Feat): Role =>
  MODE_ROLE[String(f.properties.mode)] ?? "zone";
const newId = () => crypto.randomUUID();

function SelectedCard({ ctx }: { ctx: Ctx }) {
  const { ws, selectedId, zoneHits } = ctx;
  const f = ws.features.find((x) => x.id === selectedId);
  const [meters, setMeters] = useState(200);
  if (!f) return null;
  const role = roleOf(f);
  const meta = ws.meta[f.id] ?? { name: "" };
  const units = ws.settings.units;
  const hits = zoneHits[f.id];

  const makeRoute = (kind: "ring" | "sweep") => {
    const coords = kind === "ring" ? patrolRing(f, 150) : sweepPath(f, 250);
    if (!coords || coords.length < 2) return;
    const free = FLEET.find((d) => !ws.features.some((x) => roleOf(x) === "route" && ws.meta[x.id]?.droneId === d.id));
    const id = newId();
    ctx.addFeature({ id, type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: { mode: "route" } }, "route");
    ctx.setMeta(id, { name: `${kind === "ring" ? "Patrullaje" : "Barrido"} ${meta.name}`, droneId: free?.id });
  };

  const makeBuffer = (m: number, asNew: boolean) => {
    const b = buffer(
      {
        type: "Feature",
        properties: {},
        geometry: f.geometry as unknown as GeoJSON.Geometry,
      },
      m / 1000,
      { units: "kilometers" },
    );
    if (!b || b.geometry.type !== "Polygon") return;
    if (asNew || role === "line" || role === "route") {
      ctx.addFeature(
        {
          id: newId(),
          type: "Feature",
          geometry: b.geometry,
          properties: { mode: "zone-polygon", bufferM: m },
        },
        "zone",
      );
    } else {
      ctx.setFeatures(
        ws.features.map((x) =>
          x.id === f.id ? { ...x, geometry: b.geometry } : x,
        ),
      );
    }
  };

  return (
    <Card
      title="Elemento seleccionado"
      right={
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-sm"
            style={{ background: ROLE_COLOR[role] }}
          />
          <Badge>
            {
              { zone: "Zona", line: "Línea", route: "Ruta", sensor: "Sensor" }[
                role
              ]
            }
          </Badge>
        </span>
      }
    >
      <div className="space-y-3">
        <Field label="Nombre">
          <input
            className={inputCls}
            value={meta.name}
            onChange={(e) => ctx.setMeta(f.id, { name: e.target.value })}
          />
        </Field>
        {role === "zone" && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Superficie" value={fmtArea(areaHa(f), units)} />
            <Stat
              label="Focos (10 d)"
              value={hits?.total ?? 0}
              sub={`${hits?.recent ?? 0} en 48 h · buffer ${ws.settings.bufferKm} km`}
              tone={hits?.recent ? "fire" : undefined}
            />
          </div>
        )}
        {role === "zone" && ctx.zoneRisk[f.id] && (
          <div className="flex items-center gap-2 text-[12px]">
            <span className="size-2.5 rounded-full" style={{ background: ctx.zoneRisk[f.id].color }} />
            <span>Riesgo {ctx.zoneRisk[f.id].label.toLowerCase()} ({ctx.zoneRisk[f.id].score})</span>
            <span className="text-foreground/45">{Math.round(ctx.zoneRisk[f.id].wx.temp)}° · {Math.round(ctx.zoneRisk[f.id].wx.rh)}% HR · {Math.round(ctx.zoneRisk[f.id].wx.wind)} km/h</span>
          </div>
        )}
        {(role === "line" || role === "route") && (
          <Stat label="Longitud" value={fmtKm(lengthKm(f))} />
        )}
        {role === "sensor" && (
          <Field label="Tipo de sensor">
            <select
              className={inputCls}
              value={meta.sensorType ?? "temp"}
              onChange={(e) =>
                ctx.setMeta(f.id, { sensorType: e.target.value as SensorType })
              }
            >
              {Object.entries(SENSOR_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label} ({v.unit})
                </option>
              ))}
            </select>
          </Field>
        )}
        {role === "route" && (
          <Field label="Dron asignado">
            <select
              className={inputCls}
              value={meta.droneId ?? ""}
              onChange={(e) =>
                ctx.setMeta(f.id, { droneId: e.target.value || undefined })
              }
            >
              <option value="">Sin asignar</option>
              {FLEET.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.kind}
                </option>
              ))}
            </select>
          </Field>
        )}
        {role !== "sensor" && (
          <div className="rounded-md bg-foreground/5 p-2.5">
            <Field
              label={
                role === "zone"
                  ? "Expandir o contraer (metros)"
                  : "Convertir en franja (metros a cada lado)"
              }
              hint="Marcá la distancia exacta que necesitás, sin depender de rectángulos."
            >
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={10}
                  max={20000}
                  step={10}
                  className={cn(inputCls, "w-24")}
                  value={meters}
                  onChange={(e) => setMeters(Number(e.target.value))}
                />
                {role === "zone" ? (
                  <>
                    <Btn
                      onClick={() => makeBuffer(meters, false)}
                      title="Agrandar"
                    >
                      <Wand2 className="size-3.5" /> +{meters} m
                    </Btn>
                    <Btn
                      onClick={() => makeBuffer(-meters, false)}
                      title="Achicar"
                    >
                      −{meters} m
                    </Btn>
                  </>
                ) : (
                  <Btn onClick={() => makeBuffer(meters, true)}>
                    <Wand2 className="size-3.5" /> Crear zona
                  </Btn>
                )}
              </div>
            </Field>
          </div>
        )}
        {role === "zone" && (
          <div className="rounded-md bg-foreground/5 p-2.5">
            <div className="mb-1.5 text-[11.5px] font-medium text-foreground/70">Misión automática de dron</div>
            <div className="grid grid-cols-2 gap-1.5">
              <Btn onClick={() => makeRoute("ring")}>Patrullar perímetro</Btn>
              <Btn onClick={() => makeRoute("sweep")}>Barrido en zigzag</Btn>
            </div>
            <p className="mt-1.5 text-[10.5px] text-foreground/45">Crea la ruta y se la asigna al primer dron libre. Verla en Drones y sensores.</p>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Btn onClick={() => ctx.map.current?.fitFeature(f)}>
            <Crosshair className="size-3.5" /> Centrar
          </Btn>
          <Btn
            variant={ctx.editing ? "active" : "ghost"}
            onClick={() => ctx.setEditing(!ctx.editing)}
          >
            <Pencil className="size-3.5" />{" "}
            {ctx.editing ? "Terminar edición" : "Editar vértices"}
          </Btn>
          <Btn variant="danger" onClick={() => ctx.removeFeature(f.id)}>
            <Trash2 className="size-3.5" /> Eliminar
          </Btn>
        </div>
        {role !== "sensor" && (
          <p className="text-[10.5px] text-foreground/40">
            Centro: {centerOf(f)[1].toFixed(4)}°, {centerOf(f)[0].toFixed(4)}°
          </p>
        )}
      </div>
    </Card>
  );
}

function ItemList({
  ctx,
  roles,
  empty,
}: {
  ctx: Ctx;
  roles: Role[];
  empty: string;
}) {
  const items = ctx.ws.features.filter((f) => roles.includes(roleOf(f)));
  const u = ctx.ws.settings.units;
  if (items.length === 0)
    return <p className="text-[12px] text-foreground/45">{empty}</p>;
  return (
    <ul className="space-y-0.5">
      {items.map((f) => {
        const r = roleOf(f);
        const h = ctx.zoneHits[f.id];
        return (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => {
                ctx.select(f.id);
                ctx.map.current?.fitFeature(f);
              }}
              aria-current={ctx.selectedId === f.id}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-foreground/5",
                ctx.selectedId === f.id && "bg-primary/10",
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ background: ROLE_COLOR[r] }}
              />
              <span className="min-w-0 flex-1 truncate">
                {ctx.ws.meta[f.id]?.name || "Sin nombre"}
              </span>
              {h && h.recent > 0 && <Badge tone="fire">{h.recent} focos</Badge>}
              <span className="shrink-0 text-[11px] tabular-nums text-foreground/45">
                {r === "zone"
                  ? fmtArea(areaHa(f), u)
                  : r === "sensor"
                    ? ""
                    : fmtKm(lengthKm(f))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ZonesPanel({ ctx }: { ctx: Ctx }) {
  const [radius, setRadius] = useState(500);
  const zones = ctx.ws.features.filter((f) => roleOf(f) === "zone");
  const totalHa = zones.reduce((a, z) => a + areaHa(z), 0);

  const circleAtCenter = () => {
    const c = circle(ctx.center, radius / 1000, {
      steps: 64,
      units: "kilometers",
    });
    ctx.addFeature(
      {
        id: newId(),
        type: "Feature",
        geometry: c.geometry,
        properties: { mode: "zone-circle", radiusKm: radius / 1000 },
      },
      "zone",
    );
  };

  return (
    <div className="space-y-3 p-3.5">
      <Card title="Zonas de monitoreo">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Zonas" value={zones.length} />
          <Stat
            label="Superficie"
            value={fmtArea(totalHa, ctx.ws.settings.units)}
          />
          <Stat
            label="Con alerta"
            value={
              Object.values(ctx.zoneHits).filter((h) => h.recent > 0).length
            }
            tone="fire"
          />
        </div>
        <p className="mt-2.5 text-[11.5px] text-foreground/50">
          Elegí una herramienta a la izquierda del mapa: polígono, mano alzada,
          rectángulo, círculo o línea (cortafuegos, perímetro, camino). Podés
          pasar a 3D para ver el relieve.
        </p>
      </Card>

      <Card title="Círculo por radio exacto">
        <Field
          label="Radio (metros)"
          hint="Se crea en el centro actual del mapa."
        >
          <div className="flex gap-1.5">
            <input
              type="number"
              min={50}
              max={50000}
              step={50}
              className={cn(inputCls, "w-28")}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
            <Btn
              variant="solid"
              onClick={circleAtCenter}
              disabled={!(radius > 0)}
            >
              Crear círculo
            </Btn>
          </div>
        </Field>
      </Card>

      <SelectedCard ctx={ctx} />

      <Card
        title="Zonas y líneas"
        right={
          ctx.ws.features.length === 0 ? (
            <Btn onClick={ctx.loadDemo}>Cargar demo</Btn>
          ) : undefined
        }
      >
        <ItemList
          ctx={ctx}
          roles={["zone", "line"]}
          empty="Todavía no marcaste nada. Dibujá una zona o cargá el demo para ver cómo queda."
        />
      </Card>
    </div>
  );
}

function CommandCenter({ ctx }: { ctx: Ctx }) {
  const [sel, setSel] = useState<string | null>(null);
  const active = ctx.drones.find((d) => d.spec.id === sel) ?? ctx.drones.find((d) => d.route) ?? ctx.drones[0];
  const flying = Boolean(active.route) && !ctx.rtb.has(active.spec.id);
  const hasFire = (ctx.payload?.points.length ?? 0) > 0 && flying;
  const t = active.track;
  const wind = ctx.weather ? (ctx.weather.wind / 3.6).toFixed(1) : "--";
  return (
    <Card title="Centro de mando de flota" right={<Badge tone="sim">simulado</Badge>}>
      <div className="mb-2 flex flex-wrap gap-1">
        {ctx.drones.map((d) => (
          <Btn key={d.spec.id} variant={d.spec.id === active.spec.id ? "active" : "ghost"} onClick={() => setSel(d.spec.id)}>
            {d.spec.name}
          </Btn>
        ))}
      </div>
      {flying ? (
        <div className="relative">
          <ThermalCam seed={active.spec.id} hot={hasFire} />
          <div className="pointer-events-none absolute inset-x-2 top-1.5 flex justify-between font-mono text-[9.5px] text-[#9dffc9]">
            <span>{active.spec.name} · LINK SEGURO</span>
            <span className="text-[#ff6b5a]">● REC</span>
          </div>
          <div className="pointer-events-none absolute inset-x-2 bottom-1.5 flex justify-between font-mono text-[9.5px] text-[#9dffc9]">
            <span>{t ? `${t.pos[1].toFixed(4)}, ${t.pos[0].toFixed(4)}` : ""}</span>
            <span>ALT {active.telem.altitude} m · {active.telem.speed} km/h · HDG {t ? Math.round(t.heading) : 0}°</span>
          </div>
        </div>
      ) : (
        <div className="grid aspect-[8/5] place-items-center rounded-md bg-black/70 text-center text-[12px] text-white/60">
          {ctx.rtb.has(active.spec.id) ? "Retornando al dock…" : "En base. Asignale una ruta para ver la cámara."}
        </div>
      )}
      <div className="mt-2.5 rounded-md border border-border bg-background/60 p-2.5">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-foreground/55">
          <span>Dock {active.spec.id.toUpperCase()} · Base Alfa</span>
          <Badge tone="ok">online</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          <Stat label="Compuerta" value={flying ? "Abierta" : "Cerrada"} />
          <Stat label="Viento ext." value={`${wind}`} sub="m/s" />
          <Stat label="Clima int." value="18°" sub="auto" />
          <Stat label="UPS" value="100%" sub="red AC" tone="ok" />
        </div>
      </div>
      <Btn
        variant={ctx.followId === active.spec.id ? "active" : "ghost"}
        className="mt-2.5 w-full"
        disabled={!flying}
        onClick={() => ctx.setFollowId(ctx.followId === active.spec.id ? null : active.spec.id)}
      >
        {ctx.followId === active.spec.id ? "Dejar de seguir" : "Seguir en 3D (cámara del dron)"}
      </Btn>
      <Btn
        variant={ctx.rtb.has(active.spec.id) ? "solid" : "danger"}
        className="mt-2.5 w-full"
        disabled={!active.route}
        onClick={() => ctx.toggleRtb(active.spec.id)}
      >
        {ctx.rtb.has(active.spec.id) ? "Reanudar ruta" : "Abortar y retornar al dock"}
      </Btn>
    </Card>
  );
}

function Spark({ id, type, now, fireKm, ctx }: { id: string; type: SensorType; now: number; fireKm: number | null; ctx: Ctx }) {
  const pts = Array.from({ length: 24 }, (_, i) => sensorReading(id, type, now - (23 - i) * 60_000, fireKm, ctx.ws.settings.thresholds).value);
  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const d = pts.map((v, i) => `${(i / 23) * 56},${16 - ((v - lo) / (hi - lo || 1)) * 14}`).join(" ");
  return (
    <svg width="56" height="18" viewBox="0 0 56 18" aria-hidden className="shrink-0 text-primary/70">
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function DronesPanel({ ctx }: { ctx: Ctx }) {
  const alerts = ctx.sensors.filter((s) => s.reading.alert).length;
  return (
    <div className="space-y-3 p-3.5">
      <CommandCenter ctx={ctx} />
      <Card title="Flota" right={<Badge tone="sim">simulado</Badge>}>
        <ul className="space-y-2">
          {ctx.drones.map((d) => (
            <li
              key={d.spec.id}
              className="rounded-md border border-border bg-background/60 p-2.5"
            >
              <button
                type="button"
                disabled={!d.route}
                onClick={() => {
                  if (!d.route) return;
                  ctx.select(d.route.id);
                  ctx.map.current?.fitFeature(d.route);
                }}
                className="flex w-full items-center gap-2 text-left disabled:cursor-default"
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    d.route ? "bg-primary" : "bg-foreground/25",
                  )}
                />
                <span className="text-[13px] font-semibold">{d.spec.name}</span>
                <span className="flex-1 truncate text-[11px] text-foreground/50">
                  {d.spec.kind}
                </span>
                <Badge tone={d.route ? "ok" : "muted"}>
                  {d.route ? "En ruta" : "En base"}
                </Badge>
              </button>
              {d.route && d.track && (
                <div className="mt-2 grid grid-cols-4 gap-1 text-center">
                  <Stat
                    label="Batería"
                    value={`${d.telem.battery}%`}
                    tone={d.telem.battery < 25 ? "fire" : undefined}
                  />
                  <Stat
                    label="Altura"
                    value={`${d.telem.altitude}`}
                    sub="m AGL"
                  />
                  <Stat label="Vel." value={d.telem.speed} sub="km/h" />
                  <Stat
                    label="Avance"
                    value={`${Math.round(d.track.progress * 100)}%`}
                    sub={fmtKm(d.track.total)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10.5px] text-foreground/40">
          Dibujá una ruta con la herramienta de ruta y asignale un dron.
          Sentinel está en etapa precomercial: la telemetría es de demostración.
        </p>
      </Card>

      <SelectedCard ctx={ctx} />

      <Card
        title="Rutas"
        right={
          ctx.ws.features.length === 0 ? (
            <Btn onClick={ctx.loadDemo}>Cargar demo</Btn>
          ) : undefined
        }
      >
        <ItemList
          ctx={ctx}
          roles={["route"]}
          empty="Sin rutas. Usá la herramienta de ruta (primer ícono del mapa)."
        />
      </Card>

      <Card
        title="Sensores"
        right={
          <Badge tone={alerts ? "fire" : "sim"}>
            {alerts ? `${alerts} en alerta` : "simulado"}
          </Badge>
        }
      >
        {ctx.sensors.length === 0 && (
          <p className="text-[12px] text-foreground/45">
            Sin sensores. Colocalos sobre el mapa con la herramienta de sensor.
          </p>
        )}
        <ul className="space-y-1">
          {ctx.sensors.map((s) => (
            <li key={s.feat.id}>
              <button
                type="button"
                onClick={() => {
                  ctx.select(s.feat.id);
                  ctx.map.current?.fitFeature(s.feat);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-foreground/5",
                  ctx.selectedId === s.feat.id && "bg-primary/10",
                )}
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    s.reading.alert
                      ? "animate-pulse bg-[#e5483c]"
                      : "bg-[#0e9aa7]",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium">
                    {s.meta.name}
                  </span>
                  <span className="text-[10.5px] text-foreground/45">
                    {SENSOR_LABEL[s.type].label}
                    {s.fireKm !== null && s.fireKm < 12
                      ? ` · foco a ${s.fireKm.toFixed(1)} km`
                      : ""}
                  </span>
                </span>
                <Spark id={s.feat.id} type={s.type} now={Math.floor(ctx.now / 60000) * 60000} fireKm={s.fireKm} ctx={ctx} />
                <span
                  className={cn(
                    "font-heading text-[15px] font-bold tabular-nums",
                    s.reading.alert && "text-[#b83a3a]",
                  )}
                >
                  {s.reading.value}
                  <span className="ml-0.5 text-[10px] font-normal text-foreground/45">
                    {s.reading.unit}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
