"use client";

import { useMemo, useState } from "react";
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
const MAX_FRP = 150;
// Dot size grows with radiative power: a visual cue of intensity, not a measurement.
const dotR = (frp: number) => 2 + Math.min(frp / MAX_FRP, 1) * 3;

const VIEWS = {
  argentina: {
    label: "Argentina",
    coords: "74°O a 53°O, 21,5°S a 55,5°S",
    corners: [
      [-74, -55.5],
      [-53, -21.5],
    ],
  },
  patagonia: {
    label: "Patagonia",
    coords: "73,5°O a 66°O, 37°S a 50°S",
    corners: [
      [-73.5, -50],
      [-66, -37],
    ],
  },
} as const;
type ViewKey = keyof typeof VIEWS;

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
  const focusCls =
    "outline-none cursor-pointer [&:focus-visible>circle:first-of-type]:stroke-brand [&:focus-visible>circle:first-of-type]:stroke-2";

  return (
    <figure className="m-0 min-w-0">
      <style>{`
        .lv-camera{transition:transform 1s cubic-bezier(.22,.8,.24,1)}
        @media (prefers-reduced-motion:reduce){.lv-camera{transition:none}}
      `}</style>

      <div
        className="flex flex-wrap gap-x-5 gap-y-1 border-b rule"
        role="group"
        aria-label="Encuadre del mapa"
      >
        {(Object.keys(VIEWS) as ViewKey[]).map((key) => {
          const on = !focus && view === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => chooseView(key)}
              aria-pressed={on}
              className={`-mb-px min-h-11 border-b-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                on
                  ? "border-ink font-semibold text-ink"
                  : "border-transparent text-ink/70 hover:text-ink"
              }`}
            >
              {VIEWS[key].label}
            </button>
          );
        })}
      </div>

      <div className="relative w-full aspect-[600/760] overflow-hidden lg:aspect-auto lg:h-[min(84vh,840px)]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          onClick={() => setSel(null)}
          role="group"
          aria-label={`Mapa de ${fires.length} focos de calor y ${places.length} localidades de la Patagonia. Con el teclado, usá las flechas para recorrer los puntos y Enter para ver el detalle.`}
        >
          <g className="lv-camera" style={{ transform: camera }}>
            <path
              d={g.grid}
              fill="none"
              stroke="#14120e"
              strokeOpacity={0.12}
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
            {g.land.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="#14120e"
                fillOpacity={0.025}
                stroke="#14120e"
                strokeOpacity={0.6}
                strokeWidth={0.7}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {focus && fc && (
              <g aria-hidden="true" pointerEvents="none">
                {[100, 50].map((km) => (
                  <circle
                    key={km}
                    cx={fc[0]}
                    cy={fc[1]}
                    r={geo.argentina.kmPx(focus.lat, focus.lng, km)}
                    fill="none"
                    stroke="#14120e"
                    strokeWidth={1}
                    strokeDasharray={km === 50 ? undefined : "5 5"}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            )}

            {fires.map((f, i) => {
              const [x, y] = g.fires[i];
              if (!onMap(g.fires[i])) return null;
              const isSel = sel?.kind === "fire" && sel.i === i;
              const toggle = () => setSel(isSel ? null : { kind: "fire", i });
              const r = dotR(f.frp) / k;
              const label = `Foco de calor, ${intensity(f.frp)}, ${acquired(f).at}`;
              return (
                <g
                  key={`f${i}`}
                  {...mapPointProps(
                    label,
                    toggle,
                    i === (sel?.kind === "fire" ? sel.i : 0),
                  )}
                  className={focusCls}
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
                    r={r + 2.5 / k}
                    fill="none"
                    stroke="#b4441a"
                    strokeOpacity={0.55}
                    strokeWidth={0.7}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={x} cy={y} r={r} fill="#b4441a" />
                  {(isSel || near50.has(i)) && (
                    <circle
                      cx={x}
                      cy={y}
                      r={r + 5 / k}
                      fill="none"
                      stroke="#14120e"
                      strokeWidth={isSel ? 1.5 : 1}
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
                  className={focusCls}
                  aria-pressed={isSel}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                  }}
                >
                  <circle cx={x} cy={y} r={16 / k} fill="transparent" />
                  <rect
                    x={x - 4 / k}
                    y={y - 4 / k}
                    width={8 / k}
                    height={8 / k}
                    fill={isSel ? "#14120e" : "#f3efe5"}
                    stroke="#14120e"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}

            {focus && fc && (
              <circle
                cx={fc[0]}
                cy={fc[1]}
                r={3 / k}
                fill="#14120e"
                pointerEvents="none"
              />
            )}
          </g>
        </svg>

        {view === "patagonia" &&
          !focus &&
          places.map((p, i) =>
            onMap(g.places[i]) ? (
              <span
                key={p.name}
                aria-hidden="true"
                className="pointer-events-none absolute text-xs font-medium text-ink [text-shadow:0_0_3px_#f3efe5,0_0_3px_#f3efe5]"
                style={{
                  left: `${(g.places[i][0] / W) * 100}%`,
                  top: `${(g.places[i][1] / H) * 100}%`,
                  transform: "translate(9px,-50%)",
                }}
              >
                {p.name}
              </span>
            ) : null,
          )}
      </div>

      <figcaption className="t-caption border-t rule pt-3">
        <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 p-0 text-sm text-ink">
          <li className="flex items-center gap-2">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22">
              <circle
                cx="11"
                cy="11"
                r="8"
                fill="none"
                stroke="#b4441a"
                strokeOpacity={0.55}
              />
              <circle cx="11" cy="11" r="5" fill="#b4441a" />
            </svg>
            Foco de calor (más grande = más intenso)
          </li>
          <li className="flex items-center gap-2">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22">
              <rect
                x="7"
                y="7"
                width="8"
                height="8"
                fill="#f3efe5"
                stroke="#14120e"
                strokeWidth="1.5"
              />
            </svg>
            Localidad con lectura de riesgo
          </li>
        </ul>
        <p className="mt-2">
          Encuadre {VIEWS[view].label}: {VIEWS[view].coords}. Contorno
          simplificado.
        </p>
        <div
          aria-live="polite"
          className="mt-3 border-t border-ink pt-3 text-base text-ink"
        >
          <Detail
            sel={sel}
            fires={fires}
            places={places}
            readingTime={readingTime}
            sourceLabel={sourceLabel}
          />
        </div>
      </figcaption>
    </figure>
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
      <p className="text-ink/80">
        Tocá un foco o una localidad en el mapa para ver fuente, hora y
        confianza.
      </p>
    );
  }
  if (sel.kind === "fire") {
    const f = fires[sel.i];
    const { at, ago } = acquired(f);
    return (
      <>
        <p className="font-semibold">Foco de calor · {intensity(f.frp)}</p>
        <p className="mt-1">
          Detectado {at}
          {ago && ` (${ago})`}. Confianza{" "}
          {CONFIDENCE[f.confidence.toLowerCase()] ?? f.confidence},{" "}
          {Math.round(f.frp)} MW.
        </p>
        <p className="t-caption mt-1">
          Fuente: NASA FIRMS, {sourceLabel}. Dato preliminar: no es
          necesariamente un incendio forestal.
        </p>
      </>
    );
  }
  const p = places[sel.i];
  return (
    <>
      <p className="font-semibold">
        {p.name}, {p.province} · riesgo {p.label}
      </p>
      <p className="mt-1">{RISK_EXPLAIN[p.label]}</p>
      <p className="mt-1 tabular-nums">
        {Math.round(p.temperature)} °C · {Math.round(p.humidity)}% humedad ·{" "}
        {Math.round(p.windSpeed)} km/h
      </p>
      <p className="t-caption mt-1">
        Fuente: Open-Meteo, lectura {readingTime} (hora local). Índice
        ilustrativo propio, no es el FWI oficial.
      </p>
    </>
  );
}
