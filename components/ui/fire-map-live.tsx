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

// Dot color encodes intensity (radiative power); it is a visual cue, not a measurement.
const STRONG_FRP = 50;
const MINT = "#a9efc9";
const INK = "#e3f6dc";
const HOT = "#ffc46b";
const EMBER = "#ff7a45";
const dotColor = (frp: number) => (frp >= STRONG_FRP ? HOT : EMBER);
const dotR = (frp: number) => 2.3 + Math.min(frp / 150, 1) * 1.7;

const VIEWS = {
  argentina: {
    label: "Argentina",
    corners: [
      [-74, -55.5],
      [-53, -21.5],
    ],
  },
  patagonia: {
    label: "Patagonia",
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

const focusRing =
  "outline-none cursor-pointer [&:focus-visible>circle:first-of-type]:stroke-[#a9efc9] [&:focus-visible>circle:first-of-type]:stroke-2";

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
  // Se activa una sola vez al entrar en pantalla: dispara las entradas CSS del mapa.
  const rootRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setSeen(true);
        io.disconnect();
      },
      { threshold: 0.25 },
    );
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
              proj([
                lng + km / (111.32 * Math.cos(lat * (Math.PI / 180))),
                lat,
              ]) ?? a;
            return Math.hypot(b[0] - a[0], b[1] - a[1]);
          },
          land: backdrop.map((f) => path(f) ?? ""),
          grid: path(graticule) ?? "",
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
    <div ref={rootRef} className="lv min-w-0" data-seen={seen ? "" : undefined}>
      <style>{`
        .lv-camera{transition:transform 1.25s cubic-bezier(.65,.05,.2,1)}
        .lv-sweep{position:absolute;left:50%;top:50%;width:190%;aspect-ratio:1;margin:-95% 0 0 -95%;border-radius:50%;pointer-events:none;opacity:0;background:conic-gradient(from 0deg,rgba(255,138,76,0) 0deg,rgba(255,138,76,.22) 38deg,rgba(255,196,107,.35) 40deg,transparent 41deg)}
        .lv[data-seen] .lv-sweep{animation:lv-sweep 2.8s cubic-bezier(.4,0,.2,1) .15s both}
        @keyframes lv-sweep{0%{opacity:.95;transform:rotate(0)}85%{opacity:.6}100%{opacity:0;transform:rotate(360deg)}}
        .lv-dot,.lv-ring,.lv-grid,.lv-land,.lv-halo{transform-box:fill-box;transform-origin:center}
        .lv[data-seen] .lv-breathe{animation:lv-breathe 2.6s ease-in-out infinite}
        @keyframes lv-breathe{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(1.3)}}
        .lv:not([data-seen]) .lv-dot,.lv:not([data-seen]) .lv-grid,.lv:not([data-seen]) .lv-land{opacity:0}
        .lv[data-seen] .lv-dot{animation:lv-pop .55s cubic-bezier(.22,.8,.24,1) both;animation-delay:var(--d,0ms)}
        .lv[data-seen] .lv-grid{animation:lv-fade 1.6s ease-out both}
        .lv[data-seen] .lv-land{animation:lv-fade 1.1s ease-out both}
        .lv-ring{animation:lv-ring 1s cubic-bezier(.22,.8,.24,1) both;animation-delay:var(--d,0ms)}
        @keyframes lv-pop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:none}}
        @keyframes lv-fade{from{opacity:0}to{opacity:1}}
        @keyframes lv-ring{from{opacity:0;transform:scale(.15)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.lv-camera{transition:none}.lv-dot,.lv-ring,.lv-grid,.lv-land,.lv-halo{animation:none!important;opacity:1!important;transform:none!important}}
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-a-line px-5 py-3 sm:px-6">
        <div className="flex gap-2" role="group" aria-label="Encuadre del mapa">
          {(Object.keys(VIEWS) as ViewKey[]).map((key) => {
            const on = !focus && view === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => chooseView(key)}
                aria-pressed={on}
                className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-a-accent ${
                  on
                    ? "border-a-accent bg-a-accent text-[#06150d]"
                    : "border-a-line bg-[rgb(214_245_201/0.05)] text-[#e3f6dc] hover:bg-[rgb(214_245_201/0.11)]"
                }`}
              >
                {VIEWS[key].label}
              </button>
            );
          })}
        </div>

        <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-a-mute">
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-[#ffc46b] shadow-[0_0_8px_2px_rgba(255,196,107,0.7)]"
            />
            Foco intenso (50 MW o más)
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-[#ff7a45] shadow-[0_0_8px_2px_rgba(255,122,69,0.7)]"
            />
            Foco menor
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rotate-45 border-2 border-[#5fe3a1]"
            />
            Localidad (color = riesgo)
          </li>
        </ul>
      </div>

      <div className="a-brackets relative w-full overflow-hidden bg-a-surface aspect-[600/760] lg:aspect-auto lg:h-[min(84vh,840px)]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          onClick={() => setSel(null)}
          role="group"
          aria-label={`Mapa de ${fires.length} focos de calor y ${places.length} localidades de la Patagonia. Con el teclado, usá las flechas para recorrer los puntos y Enter para ver el detalle.`}
        >
          <defs>
            <radialGradient id="lv-heat-hi">
              <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.95" />
              <stop offset="0.35" stopColor="#ff9a3d" stopOpacity="0.5" />
              <stop offset="1" stopColor="#ff6a2b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="lv-heat-lo">
              <stop offset="0" stopColor="#ff9a6b" stopOpacity="0.8" />
              <stop offset="0.4" stopColor="#ff6a2b" stopOpacity="0.35" />
              <stop offset="1" stopColor="#ff6a2b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g className="lv-camera" style={{ transform: camera }}>
            <path
              className="lv-grid"
              d={g.grid}
              fill="none"
              stroke="rgba(214,245,201,0.07)"
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
            />
            {g.land.map((d, i) => (
              <path
                key={i}
                className="lv-land"
                d={d}
                fill="rgba(169,239,201,0.1)"
                stroke="rgba(169,239,201,0.45)"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {fires.map((f, i) => {
              const [x, y] = g.fires[i];
              if (!onMap(g.fires[i])) return null;
              const isSel = sel?.kind === "fire" && sel.i === i;
              const toggle = () => setSel(isSel ? null : { kind: "fire", i });
              const label = `Foco de calor, ${intensity(f.frp)}, ${acquired(f).at}`;
              const color = dotColor(f.frp);
              const r = (isSel ? 5 : dotR(f.frp)) / k;
              return (
                <g
                  key={`f${i}`}
                  {...mapPointProps(
                    label,
                    toggle,
                    i === (sel?.kind === "fire" ? sel.i : 0),
                  )}
                  className={`${focusRing} lv-dot`}
                  style={{ "--d": `${300 + Math.min(i * 14, 1100)}ms` } as React.CSSProperties}
                  aria-pressed={isSel}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                  }}
                >
                  <circle cx={x} cy={y} r={14 / k} fill="transparent" />
                  <circle
                    cx={x}
                    cy={y}
                    r={(isSel ? 18 : f.frp >= STRONG_FRP ? 16 : 11) / k}
                    fill={f.frp >= STRONG_FRP ? "url(#lv-heat-hi)" : "url(#lv-heat-lo)"}
                    className={f.frp >= STRONG_FRP ? "lv-halo lv-breathe" : "lv-halo"}
                    pointerEvents="none"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={r + 2.5 / k}
                    fill="none"
                    stroke={color}
                    strokeOpacity={0.5}
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={r}
                    fill={color}
                    stroke={isSel ? INK : "none"}
                    strokeWidth={1.5 / k}
                  />
                  {near50.has(i) && (
                    <circle
                      cx={x}
                      cy={y}
                      r={9 / k}
                      fill="none"
                      stroke={INK}
                      strokeWidth={1.25}
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
              return (
                <g
                  key={`p${i}`}
                  {...mapPointProps(
                    `${p.name}: riesgo ${p.label}`,
                    toggle,
                    false,
                  )}
                  className={`${focusRing} lv-dot`}
                  style={{ "--d": `${1500 + i * 90}ms` } as React.CSSProperties}
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
                    fill="#0c1310"
                    stroke={RISK_ON_DARK[p.label]}
                    strokeWidth={(isSel ? 3 : 2) / k}
                  />
                </g>
              );
            })}

            {focus && fc && (
              <g aria-hidden="true" pointerEvents="none">
                {[100, 50].map((km, n) => (
                  <circle
                    key={`${km}-${focus.lat}-${focus.lng}`}
                    className="lv-ring"
                    style={{ "--d": `${650 + n * 160}ms` } as React.CSSProperties}
                    cx={fc[0]}
                    cy={fc[1]}
                    r={geo.argentina.kmPx(focus.lat, focus.lng, km)}
                    fill="none"
                    stroke={MINT}
                    strokeWidth={1.25}
                    strokeDasharray={km === 50 ? undefined : "6 6"}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <circle
                  key={`c-${focus.lat}-${focus.lng}`}
                  className="lv-ring"
                  style={{ "--d": "500ms" } as React.CSSProperties}
                  cx={fc[0]}
                  cy={fc[1]}
                  r={4 / k}
                  fill={MINT}
                />
              </g>
            )}
          </g>
        </svg>
        <span aria-hidden="true" className="lv-sweep" />
        <span aria-hidden="true" className="a-bk a-bk-tr" />
        <span aria-hidden="true" className="a-bk a-bk-bl" />

        {view === "patagonia" &&
          !focus &&
          places.map((p, i) =>
            onMap(g.places[i]) ? (
              <span
                key={p.name}
                aria-hidden="true"
                className="pointer-events-none absolute text-xs font-medium text-[#e3f6dc] [text-shadow:0_1px_3px_#0c1310]"
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
          aria-live="polite"
          className="absolute inset-x-3 bottom-11 sm:left-11 rounded-xl border border-a-line bg-a-bg p-4 text-sm leading-relaxed text-[#e3f6dc] sm:right-auto sm:max-w-sm"
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
      <p className="text-a-mute">
        Tocá un foco o una localidad para ver fuente, hora y confianza.
      </p>
    );
  }
  if (sel.kind === "fire") {
    const f = fires[sel.i];
    const { at, ago } = acquired(f);
    return (
      <>
        <p className="text-xs font-medium uppercase tracking-wider text-[#f5b25f]">
          Foco de calor · {intensity(f.frp)}
        </p>
        <p className="mt-1.5">
          Detectado {at}
          {ago && ` (${ago})`}. Confianza{" "}
          {CONFIDENCE[f.confidence.toLowerCase()] ?? f.confidence},{" "}
          {Math.round(f.frp)} MW.
        </p>
        <p className="mt-1.5 text-a-mute">
          Fuente: NASA FIRMS, {sourceLabel}. Dato preliminar: no es
          necesariamente un incendio forestal.
        </p>
      </>
    );
  }
  const p = places[sel.i];
  return (
    <>
      <p
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: RISK_ON_DARK[p.label] }}
      >
        {p.name}, {p.province} · riesgo {p.label}
      </p>
      <p className="mt-1.5">{RISK_EXPLAIN[p.label]}</p>
      <p className="mt-1.5 tabular-nums">
        {Math.round(p.temperature)} °C · {Math.round(p.humidity)}% humedad ·{" "}
        {Math.round(p.windSpeed)} km/h
      </p>
      <p className="mt-1.5 text-a-mute">
        Fuente: Open-Meteo, lectura {readingTime} (hora local). Índice
        ilustrativo propio, no es el FWI oficial.
      </p>
    </>
  );
}
