"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoGraticule, geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import countriesGeoJson from "@/data/latam-countries.json";
import { mapPointProps } from "@/components/ui/map-tooltip";
import { haversineKm } from "@/components/locality-stats";

export interface LiveFire {
  lat: number;
  lng: number;
  frp: number;
  confidence: string;
  acqDate: string;
  acqTime: string;
}

export interface LivePlace {
  name: string;
  province: string;
  lat: number;
  lon: number;
  label: "Bajo" | "Moderado" | "Alto" | "Extremo";
  temperature: number;
  humidity: number;
  windSpeed: number;
}

interface Props {
  fires: LiveFire[]; // strongest first
  places: LivePlace[];
  readingTime: string;
  sourceLabel: string;
  /** Localidad elegida en el buscador: el mapa se acerca y dibuja anillos de 50 y 100 km. */
  focus?: { lat: number; lng: number } | null;
  onFocusClear?: () => void;
}

const W = 600;
const H = 760;
const PULSING = 30; // only the strongest fires animate; the rest are static dots
const countries = countriesGeoJson as FeatureCollection<
  Geometry,
  { name: string }
>;
const backdrop = countries.features.filter((f) =>
  [
    "Argentina",
    "Chile",
    "Uruguay",
    "Paraguay",
    "Bolivia",
    "Brazil",
    "Brasil",
  ].includes(f.properties.name),
);
const graticule = geoGraticule().step([4, 4])();
const graticuleFine = geoGraticule().step([1, 1])();
const MAX_FRP = 150;
// Halo radius grows with radiative power: a visual cue of intensity, not a measurement.
const haloR = (frp: number) => 7 + Math.min(frp / MAX_FRP, 1) * 15;

const VIEWS = {
  argentina: {
    label: "Argentina",
    coords: ["74°O · 21,5°S", "53°O · 55,5°S"],
    corners: [
      [-74, -55.5],
      [-53, -21.5],
    ],
  },
  patagonia: {
    label: "Patagonia",
    coords: ["73,5°O · 37°S", "66°O · 50°S"],
    corners: [
      [-73.5, -50],
      [-66, -37],
    ],
  },
} as const;
type ViewKey = keyof typeof VIEWS;

// Brighter than RISK_STYLE.text, which is tuned for the light background.
const RISK_ON_DARK = {
  Bajo: "#5fe3a1",
  Moderado: "#f1e06b",
  Alto: "#f1b46b",
  Extremo: "#ff8f85",
} as const;

const RISK_EXPLAIN = {
  Bajo: "Condiciones tranquilas, riesgo bajo de que un fuego se propague.",
  Moderado: "Vigilar: condiciones que podrían favorecer un incendio.",
  Alto: "Un incendio se propagaría rápido en estas condiciones.",
  Extremo: "Alerta: condiciones muy peligrosas para incendios forestales.",
} as const;

const CONFIDENCE: Record<string, string> = {
  n: "media",
  h: "alta",
  nominal: "media",
  high: "alta",
};

function intensity(frp: number) {
  if (frp < 10) return "Foco chico";
  if (frp < 50) return "Foco moderado";
  if (frp < 150) return "Foco grande";
  return "Foco muy intenso";
}

function acquired(f: LiveFire) {
  const t = f.acqTime.padStart(4, "0");
  const at = `${f.acqDate} ${t.slice(0, 2)}:${t.slice(2)} UTC`;
  const ms = Date.parse(`${f.acqDate}T${t.slice(0, 2)}:${t.slice(2)}:00Z`);
  if (Number.isNaN(ms)) return { at, ago: "" };
  const h = Math.max(0, Math.round((Date.now() - ms) / 36e5));
  return { at, ago: h <= 0 ? "hace instantes" : `hace ${h} h` };
}

type Sel = { kind: "fire" | "place"; i: number } | null;

export function FireMapLive({
  fires,
  places,
  readingTime,
  sourceLabel,
  focus = null,
  onFocusClear,
}: Props) {
  const [view, setView] = useState<ViewKey>("argentina");
  const [sel, setSel] = useState<Sel>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Pauses the CSS pulses while the map is off-screen; set on the node so it
  // never triggers a React render.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      el.dataset.live = e.isIntersecting ? "1" : "0";
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const geo = useMemo(() => {
    const r = (n: number) => Math.round(n * 10) / 10;
    return (Object.keys(VIEWS) as ViewKey[]).reduce(
      (acc, key) => {
        const proj = geoMercator().fitExtent(
          [
            [12, 12],
            [W - 12, H - 12],
          ],
          {
            type: "MultiPoint",
            coordinates: VIEWS[key].corners as unknown as [number, number][],
          },
        );
        const path = geoPath(proj);
        const at = (lat: number, lng: number) => {
          const p = proj([lng, lat]) ?? [-99, -99];
          return [r(p[0]), r(p[1])] as [number, number];
        };
        acc[key] = {
          at,
          kmPx: (lat: number, lng: number, km: number) => {
            const a = proj([lng, lat]) ?? [0, 0];
            const b =
              proj([lng + km / (111.32 * Math.cos(lat * (Math.PI / 180))), lat]) ??
              a;
            return Math.hypot(b[0] - a[0], b[1] - a[1]);
          },
          land: backdrop.map((f) => path(f) ?? ""),
          grid: path(graticule) ?? "",
          fine: path(graticuleFine) ?? "",
          fires: fires.map((f) => at(f.lat, f.lng)),
          places: places.map((p) => at(p.lat, p.lon)),
        };
        return acc;
      },
      {} as Record<
        ViewKey,
        {
          at: (lat: number, lng: number) => [number, number];
          kmPx: (lat: number, lng: number, km: number) => number;
          land: string[];
          grid: string;
          fine: string;
          fires: [number, number][];
          places: [number, number][];
        }
      >,
    );
  }, [fires, places]);

  // Con una localidad elegida el encuadre es siempre el de Argentina, ampliado
  // con una transformación CSS (barata, animable) y no recalculando proyecciones.
  const g = geo[focus ? "argentina" : view];
  const fc = focus ? geo.argentina.at(focus.lat, focus.lng) : null;
  const k = focus
    ? Math.min(
        60,
        Math.max(1, 120 / geo.argentina.kmPx(focus.lat, focus.lng, 50)),
      )
    : 1;
  const near50 = useMemo(
    () =>
      new Set(
        focus
          ? fires.flatMap((f, i) =>
              haversineKm(focus.lat, focus.lng, f.lat, f.lng) <= 50 ? [i] : [],
            )
          : [],
      ),
    [focus, fires],
  );
  const camera =
    fc && focus
      ? `translate(${W / 2 - k * fc[0]}px, ${H / 2 - k * fc[1]}px) scale(${k})`
      : "translate(0px, 0px) scale(1)";
  const onMap = ([x, y]: [number, number]) => x > 0 && x < W && y > 0 && y < H;
  const chooseView = (v: ViewKey) => {
    setView(v);
    setSel(null);
    onFocusClear?.();
  };

  return (
    <div
      ref={boxRef}
      data-live="1"
      className="lv relative overflow-hidden rounded-[20px] border border-white/12 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
      style={{
        background:
          "radial-gradient(ellipse at 50% 38%, #22251f 0%, #161512 55%, #0d0c0a 100%)",
      }}
    >
      <style>{`
        @keyframes lv-ping{0%{transform:scale(1);opacity:.55}100%{transform:scale(4.5);opacity:0}}
        .lv-pulse{transform-box:fill-box;transform-origin:center;animation:lv-ping 2.4s ease-out infinite}
        .lv[data-live="0"] .lv-pulse{animation-play-state:paused}
        .lv-camera{transition:transform 1s cubic-bezier(.22,.8,.24,1)}
        @media (prefers-reduced-motion:reduce){.lv-camera{transition:none}.lv-pulse{animation:none;opacity:.25;transform:scale(2.2)}}
      `}</style>

      <div className="relative w-full aspect-[600/760] lg:aspect-auto lg:h-[min(84vh,840px)]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full"
          onClick={() => setSel(null)}
          role="group"
          aria-label={`Mapa de ${fires.length} focos de calor y ${places.length} localidades de la Patagonia. Con el teclado, usá las flechas para recorrer los puntos y Enter para ver el detalle.`}
        >
          <defs>
            <radialGradient id="lv-halo">
              <stop offset="0" stopColor="#ff9a4d" stopOpacity="0.75" />
              <stop offset="0.35" stopColor="#e8732a" stopOpacity="0.35" />
              <stop offset="1" stopColor="#e8732a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className="lv-camera" style={{ transform: camera }}>
          <path
            d={g.fine}
            fill="none"
            stroke="rgba(244,239,226,0.035)"
            strokeWidth={0.4}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={g.grid}
            fill="none"
            stroke="rgba(95,227,161,0.12)"
            strokeWidth={0.6}
            strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
          />
          {g.land.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="rgba(244,239,226,0.06)"
              stroke="rgba(244,239,226,0.32)"
              strokeWidth={0.8}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <g aria-hidden="true" pointerEvents="none">
            {fires.map((f, i) => {
              const [x, y] = g.fires[i];
              if (!onMap(g.fires[i])) return null;
              return (
                <circle
                  key={`h${i}`}
                  cx={x}
                  cy={y}
                  r={haloR(f.frp) / k}
                  fill="url(#lv-halo)"
                  opacity={0.35 + Math.min(f.frp / MAX_FRP, 1) * 0.65}
                />
              );
            })}
          </g>

          {fires.map((f, i) => {
            const [x, y] = g.fires[i];
            if (!onMap(g.fires[i])) return null;
            const isSel = sel?.kind === "fire" && sel.i === i;
            const toggle = () => setSel(isSel ? null : { kind: "fire", i });
            const label = `Foco de calor, ${intensity(f.frp)}, ${acquired(f).at}`;
            return (
              <g
                key={`f${i}`}
                {...mapPointProps(
                  label,
                  toggle,
                  i === (sel?.kind === "fire" ? sel.i : 0),
                )}
                className="outline-none cursor-pointer [&:focus-visible>circle:first-of-type]:stroke-[#5fe3a1] [&:focus-visible>circle:first-of-type]:stroke-2"
                aria-pressed={isSel}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
              >
                <circle cx={x} cy={y} r={14 / k} fill="transparent" />
                {i < PULSING && (
                  <circle
                    className="lv-pulse"
                    cx={x}
                    cy={y}
                    r={3 / k}
                    fill="#e8732a"
                    style={{ animationDelay: `${(i % 8) * 0.3}s` }}
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={(isSel ? 5 : 2.5 + Math.min(f.frp / MAX_FRP, 1) * 1.5) / k}
                  fill="#ff8a3d"
                  stroke={isSel ? "#f4efe2" : "none"}
                  strokeWidth={1.5 / k}
                />
                {near50.has(i) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={8 / k}
                    fill="none"
                    stroke="#f4efe2"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </g>
            );
          })}

          {places.map((p, i) => {
            const [x, y] = g.places[i];
            if (!onMap(g.places[i])) return null;
            const isSel = sel?.kind === "place" && sel.i === i;
            const toggle = () => setSel(isSel ? null : { kind: "place", i });
            const color = RISK_ON_DARK[p.label];
            return (
              <g
                key={`p${i}`}
                {...mapPointProps(
                  `${p.name}: riesgo ${p.label}`,
                  toggle,
                  false,
                )}
                className="outline-none cursor-pointer [&:focus-visible>circle:first-of-type]:stroke-[#5fe3a1] [&:focus-visible>circle:first-of-type]:stroke-2"
                aria-pressed={isSel}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
              >
                <circle cx={x} cy={y} r={16 / k} fill="transparent" />
                <rect
                  x={x - 5 / k}
                  y={y - 5 / k}
                  width={10 / k}
                  height={10 / k}
                  transform={`rotate(45 ${x} ${y})`}
                  fill="#12110e"
                  stroke={color}
                  strokeWidth={(isSel ? 3 : 2) / k}
                />
              </g>
            );
          })}

          {focus && fc && (
            <g aria-hidden="true" pointerEvents="none">
              {[100, 50].map((km) => (
                <circle
                  key={km}
                  cx={fc[0]}
                  cy={fc[1]}
                  r={geo.argentina.kmPx(focus.lat, focus.lng, km)}
                  fill={km === 50 ? "rgba(95,227,161,0.07)" : "none"}
                  stroke="#5fe3a1"
                  strokeWidth={1.5}
                  strokeDasharray={km === 50 ? undefined : "6 6"}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <circle cx={fc[0]} cy={fc[1]} r={4 / k} fill="#5fe3a1" />
            </g>
          )}
          </g>
        </svg>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(8,8,6,0.75) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="bg-noise pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        />
        {[
          "left-2 top-2 border-l-2 border-t-2 rounded-tl-lg",
          "right-2 top-2 border-r-2 border-t-2 rounded-tr-lg",
          "left-2 bottom-2 border-b-2 border-l-2 rounded-bl-lg",
          "right-2 bottom-2 border-b-2 border-r-2 rounded-br-lg",
        ].map((c) => (
          <span
            key={c}
            aria-hidden="true"
            className={`pointer-events-none absolute size-5 border-[#5fe3a1]/60 ${c}`}
          />
        ))}
        <p
          aria-hidden="true"
          className="t-label pointer-events-none absolute bottom-4 right-10 hidden tabular-nums text-[#f4efe2]/65 sm:block"
        >
          {VIEWS[view].coords[0]} → {VIEWS[view].coords[1]}
        </p>

        {view === "patagonia" && !focus &&
          places.map((p, i) =>
            onMap(g.places[i]) ? (
              <span
                key={p.name}
                aria-hidden="true"
                className="pointer-events-none absolute text-xs font-medium text-[#f4efe2] [text-shadow:0_1px_3px_#12110e]"
                style={{
                  left: `${(g.places[i][0] / W) * 100}%`,
                  top: `${(g.places[i][1] / H) * 100}%`,
                  transform: "translate(12px,-50%)",
                }}
              >
                {p.name}
              </span>
            ) : null,
          )}

        <div
          className="absolute left-5 top-5 flex gap-1.5"
          role="group"
          aria-label="Encuadre del mapa"
        >
          {(Object.keys(VIEWS) as ViewKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => chooseView(k)}
              aria-pressed={!focus && view === k}
              className={`t-label min-h-11 rounded-lg border px-3.5 backdrop-blur transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5fe3a1] ${
                !focus && view === k
                  ? "border-[#5fe3a1]/60 bg-[#5fe3a1]/15 text-[#5fe3a1]"
                  : "border-white/20 bg-[#12110e]/70 text-[#f4efe2]/80 hover:text-[#f4efe2]"
              }`}
            >
              {VIEWS[k].label}
            </button>
          ))}
        </div>

        <ul className="glass absolute right-5 top-5 m-0 hidden list-none flex-col gap-1.5 rounded-xl px-3.5 py-2.5 text-xs text-[#f4efe2]/85 sm:flex">
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-[#ff8a3d] shadow-[0_0_10px_3px_rgba(232,115,42,0.6)]"
            />
            Foco de calor (más halo = más intenso)
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="ml-0.5 size-2 rotate-45 border-2 border-[#5fe3a1]"
            />
            Localidad (color = riesgo)
          </li>
        </ul>

        <div
          aria-live="polite"
          className="glass absolute inset-x-5 bottom-5 rounded-xl p-4 text-sm leading-relaxed text-[#f4efe2] sm:right-auto sm:max-w-sm"
        >
          <Detail
            sel={sel}
            fires={fires}
            places={places}
            readingTime={readingTime}
            sourceLabel={sourceLabel}
          />
        </div>
      </div>
    </div>
  );
}

function Detail({
  sel,
  fires,
  places,
  readingTime,
  sourceLabel,
}: Props & { sel: Sel }) {
  if (!sel) {
    return (
      <p className="text-[#f4efe2]/80">
        Tocá un foco o una localidad para ver fuente, hora y confianza.
      </p>
    );
  }
  if (sel.kind === "fire") {
    const f = fires[sel.i];
    const { at, ago } = acquired(f);
    return (
      <>
        <p className="t-label text-[#f3b384]">
          Foco de calor · {intensity(f.frp)}
        </p>
        <p className="mt-1.5">
          Detectado {at}
          {ago && ` (${ago})`}. Confianza{" "}
          {CONFIDENCE[f.confidence.toLowerCase()] ?? f.confidence},{" "}
          {Math.round(f.frp)} MW.
        </p>
        <p className="mt-1.5 text-[#f4efe2]/75">
          Fuente: NASA FIRMS, {sourceLabel}. Dato preliminar: no es
          necesariamente un incendio forestal.
        </p>
      </>
    );
  }
  const p = places[sel.i];
  return (
    <>
      <p className="t-label" style={{ color: RISK_ON_DARK[p.label] }}>
        {p.name}, {p.province} · riesgo {p.label}
      </p>
      <p className="mt-1.5">{RISK_EXPLAIN[p.label]}</p>
      <p className="mt-1.5 tabular-nums">
        {Math.round(p.temperature)} °C · {Math.round(p.humidity)}% humedad ·{" "}
        {Math.round(p.windSpeed)} km/h
      </p>
      <p className="mt-1.5 text-[#f4efe2]/75">
        Fuente: Open-Meteo, lectura {readingTime} (hora local). Índice
        ilustrativo propio, no es el FWI oficial.
      </p>
    </>
  );
}
