"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  Navigation2,
  Plus,
  Rotate3d,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BASES } from "@/lib/admin/map-config";
import type { MsgKey } from "@/lib/admin/i18n";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import type { BaseLayer } from "@/lib/admin/types";
import type { useAdmin } from "./use-admin";
import { Toolbar } from "./toolbar";
import { MapLegend } from "./map/legend";
import { SearchBox } from "./map/search-box";
import { MeasureTool, MeasureToggle } from "./map/measure-tool";

type A = ReturnType<typeof useAdmin>;

const glass =
  "glass rounded-xl border border-[var(--hairline)] shadow-[var(--shadow-1)]";

/** Compass: needle follows the bearing; click resets north. */
function Compass({ a }: { a: A }) {
  const { bearing, pitch } = a.ctx.camera;
  const t = a.ctx.t;
  return (
    <button
      type="button"
      onClick={() => a.mapRef.current?.resetNorth()}
      aria-label={t("mc.northAria", { n: Math.round(((bearing % 360) + 360) % 360) })}
      title={t("mc.north")}
      className={cn(
        glass,
        "group grid size-10 place-items-center transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <span
        className="relative grid size-7 place-items-center"
        style={{ transform: `rotate(${-bearing}deg)` }}
      >
        <Navigation2
          className="size-5 fill-[var(--fire)] text-[var(--fire)] transition-transform group-hover:scale-110"
          aria-hidden
        />
        <span className="absolute -top-1 text-[7px] font-bold text-foreground/70">
          N
        </span>
      </span>
      {pitch > 1 && (
        <span className="sr-only">{t("mc.tilt", { n: Math.round(pitch) })}</span>
      )}
    </button>
  );
}

function BasePicker({ a }: { a: A }) {
  const [open, setOpen] = useState(false);
  const cur = a.s.baseLayer;
  const t = a.ctx.t;
  const baseLabel = (id: BaseLayer) => t(`base.${id}` as MsgKey);
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("mc.baseAria", { label: baseLabel(cur) })}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className={cn(
          glass,
          "flex h-10 items-center gap-2 pl-1.5 pr-2.5 text-[11.5px] font-medium transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BASES[cur].thumb}
          alt=""
          width={28}
          height={28}
          className="size-7 rounded-md object-cover shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]"
        />
        <span className="hidden sm:inline">{baseLabel(cur)}</span>
        <Layers className="size-3.5 text-foreground/50" aria-hidden />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("mc.base")}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className={cn(glass, "absolute right-0 top-12 z-30 w-52 p-1")}
        >
          {(Object.keys(BASES) as BaseLayer[]).map((id) => (
            <li key={id}>
              <button
                type="button"
                role="option"
                aria-selected={id === cur}
                onClick={() => {
                  a.setSettings({ baseLayer: id });
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-foreground/[0.06]",
                  id === cur && "bg-primary/10",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BASES[id].thumb}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="size-8 rounded-md object-cover"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium">
                    {baseLabel(id)}
                  </span>
                  <span className="block truncate text-[10px] text-foreground/45">
                    {t(`base.${id}.hint` as MsgKey)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chips({ a }: { a: A }) {
  const t = a.ctx.t;
  const loc = NUM_LOCALE[a.ctx.ws.settings.locale];
  const f = a.fires;
  const avg = f.length
    ? Math.round(f.reduce((x, p) => x + p[2], 0) / f.length)
    : 0;
  const high = f.filter((p) => p[3] === 2).length;
  const items = [
    { k: t("mc.chip.fires"), v: f.length.toLocaleString(loc), c: "#c2540a" },
    { k: t("mc.chip.frp"), v: `${avg} MW`, c: "#8a6a00" },
    {
      k: t("mc.chip.conf"),
      v: high.toLocaleString(loc),
      c: "var(--primary)",
    },
  ];
  return (
    <div
      className={cn(
        glass,
        "num hidden items-center gap-2.5 rounded-lg px-2.5 py-1 text-[11px] sm:flex",
      )}
      aria-live="polite"
    >
      {items.map((c, i) => (
        <span key={c.k} className="flex items-baseline gap-1" title={c.k}>
          {i > 0 && (
            <span
              className="mr-1.5 h-3 w-px self-center bg-[var(--hairline)]"
              aria-hidden
            />
          )}
          <b className="font-semibold" style={{ color: c.c }}>
            {c.v}
          </b>
          <span className="text-foreground/50">
            {[t("mc.s.fires"), t("mc.s.frp"), t("mc.s.conf")][i]}
          </span>
        </span>
      ))}
    </div>
  );
}

/** Bottom-right cluster: 2D/3D, zoom factor and fullscreen, like the reference. */
function ViewCluster({ a }: { a: A }) {
  const { ctx } = a;
  const t = ctx.t;
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
  const factor = Math.pow(2, ctx.camera.zoom - a.region.zoom);
  return (
    <div className={cn(glass, "flex items-center gap-0.5 p-1")}>
      {(["2d", "3d"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={ctx.view === v}
          aria-label={t("mc.view", { v: v.toUpperCase() })}
          onClick={() => ctx.setView(v)}
          className={cn(
            "flex h-7 items-center gap-1 rounded-lg px-2.5 text-[11.5px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            ctx.view === v
              ? "bg-[var(--fire)] text-white shadow-sm"
              : "text-foreground/55 hover:bg-foreground/[0.06] hover:text-foreground",
          )}
        >
          {v === "3d" && <Box className="size-3" aria-hidden />}
          {v}
        </button>
      ))}
      {ctx.view === "3d" && (
        <button
          type="button"
          aria-pressed={ctx.orbit}
          aria-label={t("top.orbitStart")}
          title={t("top.orbitStart")}
          onClick={() => ctx.setOrbit(!ctx.orbit)}
          className={cn(
            "grid size-7 place-items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            ctx.orbit
              ? "bg-primary text-primary-foreground"
              : "text-foreground/55 hover:bg-foreground/[0.06]",
          )}
        >
          <Rotate3d className="size-3.5" />
        </button>
      )}
      <span className="mx-0.5 h-4 w-px bg-[var(--hairline)]" />
      <button
        type="button"
        aria-label={t("mc.zoomOut")}
        onClick={() => a.mapRef.current?.zoomBy(-0.8)}
        className="grid size-7 place-items-center rounded-lg text-foreground/55 hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="num w-9 text-center text-[11px] font-medium text-foreground/70">
        {factor >= 10 ? Math.round(factor) : factor.toFixed(1)}×
      </span>
      <button
        type="button"
        aria-label={t("mc.zoomIn")}
        onClick={() => a.mapRef.current?.zoomBy(0.8)}
        className="grid size-7 place-items-center rounded-lg text-foreground/55 hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="size-3.5" />
      </button>
      <span className="mx-0.5 h-4 w-px bg-[var(--hairline)]" />
      <button
        type="button"
        aria-label={full ? t("mc.fullExit") : t("mc.full")}
        onClick={() =>
          document.fullscreenElement
            ? document.exitFullscreen()
            : document.documentElement
                .requestFullscreen()
                .catch(() => undefined)
        }
        className="grid size-7 place-items-center rounded-lg text-foreground/55 hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {full ? (
          <Minimize2 className="size-3.5" />
        ) : (
          <Maximize2 className="size-3.5" />
        )}
      </button>
    </div>
  );
}

function fmtDeg(v: number, pos: string, neg: string) {
  const a = Math.abs(v);
  const d = Math.floor(a);
  const m = Math.round((a - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′${v >= 0 ? pos : neg}`;
}

/** Latitude / longitude ruler on the map edges (2D, north-up only). */
function Ruler({ a }: { a: A }) {
  const { camera, view } = a.ctx;
  const tr = a.ctx.t;
  const ticks = useMemo(() => {
    if (view !== "2d" || camera.pitch > 1 || Math.abs(camera.bearing) > 0.5)
      return null;
    const m = a.mapRef.current;
    const b = m?.getBounds();
    if (!m || !b) return null;
    const [w, s, e, n] = b;
    const steps = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
    const pick = (span: number) => steps.find((x) => span / x <= 6) ?? 10;
    const lngStep = pick(e - w);
    const latStep = pick(n - s);
    const xs: { v: number; px: number }[] = [];
    for (let v = Math.ceil(w / lngStep) * lngStep; v <= e; v += lngStep) {
      const p = m.project(v, (s + n) / 2);
      if (p) xs.push({ v, px: p[0] });
    }
    const ys: { v: number; px: number }[] = [];
    for (let v = Math.ceil(s / latStep) * latStep; v <= n; v += latStep) {
      const p = m.project((w + e) / 2, v);
      if (p) ys.push({ v, px: p[1] });
    }
    return { xs, ys };
    // camera changes on every frame of a move, which is when this must update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, view]);
  if (!ticks) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] hidden overflow-hidden lg:block"
      aria-hidden
    >
      {ticks.xs.map((t) => (
        <span
          key={`x${t.v}`}
          className="mono absolute top-0 -translate-x-1/2 px-1 text-[8.5px] text-foreground/45 [text-shadow:0_0_3px_var(--card)]"
          style={{ left: t.px }}
        >
          {fmtDeg(t.v, tr("mc.dirE"), tr("mc.dirW"))}
        </span>
      ))}
      {ticks.ys.map((t) => (
        <span
          key={`y${t.v}`}
          className="mono absolute right-0 -translate-y-1/2 px-1 text-[8.5px] text-foreground/45 [text-shadow:0_0_3px_var(--card)]"
          style={{ top: t.px }}
        >
          {fmtDeg(t.v, "N", "S")}
        </span>
      ))}
    </div>
  );
}

export function MapOverlays({
  a,
  cursor,
}: {
  a: A;
  cursor: [number, number] | null;
}) {
  const { ctx } = a;
  const [measuring, setMeasuring] = useState(false);
  const getMap = useCallback(
    () => a.mapRef.current?.getMap?.() ?? null,
    [a.mapRef],
  );
  const closeMeasure = useCallback(() => setMeasuring(false), []);
  // a drawing tool and the measure tool would both capture the same clicks
  useEffect(() => {
    if (ctx.tool) setMeasuring(false);
  }, [ctx.tool]);
  return (
    <>
      <Ruler a={a} />
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2 [&>*]:pointer-events-auto">
        <div className="flex flex-col items-start gap-1.5">
          <Compass a={a} />
          <MeasureToggle
            active={measuring}
            onToggle={() => setMeasuring((m) => !m)}
            t={ctx.t}
          />
        </div>
        <SearchBox a={a} t={ctx.t} locale={ctx.ws.settings.locale} />
        <div className="flex flex-col items-end gap-1.5">
          <BasePicker a={a} />
          {ctx.tab === "general" && <Chips a={a} />}
        </div>
      </div>
      {measuring && (
        <MeasureTool
          getMap={getMap}
          units={ctx.ws.settings.units}
          onClose={closeMeasure}
          t={ctx.t}
          loc={NUM_LOCALE[ctx.ws.settings.locale]}
        />
      )}

      {(ctx.tab === "zonas" || ctx.tab === "drones") && (
        <Toolbar
          tab={ctx.tab}
          tool={ctx.tool}
          setTool={ctx.setTool}
          editing={ctx.editing}
          t={ctx.t}
        />
      )}

      {(a.live || ctx.tool) && (
        <div
          className={cn(
            glass,
            "pointer-events-none absolute bottom-24 left-1/2 z-10 -translate-x-1/2 px-3.5 py-2 text-center text-[12px]",
          )}
        >
          {a.live && <b className="num mr-2 text-primary">{a.live}</b>}
          <span className="text-foreground/60">
            {ctx.t("mc.hint")}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-9 left-3 z-10 flex flex-col items-start gap-2 [&>*]:pointer-events-auto">
        {ctx.tab === "general" && <MapLegend ctx={ctx} />}
        <div
          className="mono rounded-md bg-card/80 px-2 py-1 text-[10px] text-foreground/60 backdrop-blur"
          aria-live="off"
        >
          {cursor ? `${cursor[1].toFixed(4)}°, ${cursor[0].toFixed(4)}°` : "—"}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 [&>*]:pointer-events-auto">
        <ViewCluster a={a} />
      </div>
    </>
  );
}
