"use client";

import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import countriesGeoJson from "@/data/latam-countries.json";
import { MapTooltip, mapPointProps } from "@/components/ui/map-tooltip";

export interface RiskPoint {
  name: string;
  province: string;
  lat: number;
  lon: number;
  color: string;
  label: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

const WIDTH = 480;
const HEIGHT = 480;

// ponytail: plain-language gloss for each risk tier — a badge that just
// says "Moderado" doesn't tell someone without wildfire background what
// that actually means in practice.
const RISK_EXPLAIN: Record<string, string> = {
  Bajo: "Condiciones tranquilas, riesgo bajo de que un fuego se propague.",
  Moderado: "Vigilar: condiciones que podrían favorecer un incendio.",
  Alto: "Un incendio se propagaría rápido en estas condiciones.",
  Extremo: "Alerta: condiciones muy peligrosas para incendios forestales.",
};

// ponytail: two corner points, not a real bbox polygon — a lightweight way
// to hand d3-geo a Patagonia lake-district viewport (fitExtent just needs
// something with those bounds). Manually framed since our sensor towns are
// all clustered in northern Patagonia, not the whole region.
const VIEWPORT: FeatureCollection<Geometry> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: [-73, -39.3] },
    },
    {
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: [-68, -43.5] },
    },
  ],
};

const countries = countriesGeoJson as FeatureCollection<
  Geometry,
  { name: string }
>;
const backdrop = countries.features.filter((f) =>
  ["Argentina", "Chile"].includes(f.properties.name),
);

export function PatagoniaRiskMap({ points }: { points: RiskPoint[] }) {
  const [active, setActive] = useState<number | null>(null);

  const { pathFor, project } = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [16, 16],
        [WIDTH - 16, HEIGHT - 16],
      ],
      VIEWPORT,
    );
    const path = geoPath(projection);
    return {
      pathFor: (feature: (typeof backdrop)[number]) => path(feature) ?? "",
      project: (lat: number, lon: number) => projection([lon, lat]) ?? [0, 0],
    };
  }, []);

  const activePoint = active !== null ? points[active] : undefined;
  const activePos = activePoint
    ? project(activePoint.lat, activePoint.lon)
    : null;

  return (
    <div
      className="w-full bg-[#f1ede3] rounded-lg relative font-sans"
      style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-full [mask-image:linear-gradient(to_bottom,transparent,white_4%,white_96%,transparent)]"
        onClick={() => setActive(null)}
        role="group"
        aria-label="Mapa de riesgo de incendio en la Patagonia. Usá las flechas para recorrer las localidades y Enter para ver el detalle."
      >
        {backdrop.map((feature) => (
          <path
            key={feature.properties.name}
            d={pathFor(feature)}
            fill="#1a181208"
            stroke="rgba(26,24,18,0.2)"
            strokeWidth={0.75}
          />
        ))}

        {points.map((point, i) => {
          const [x, y] = project(point.lat, point.lon);
          const isActive = i === active;
          const toggle = () => setActive(isActive ? null : i);
          const label = `${point.name}: riesgo ${point.label}, ${Math.round(point.temperature)} °C`;
          return (
            <g
              key={point.name}
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              style={{ cursor: "pointer" }}
              aria-pressed={isActive}
              {...mapPointProps(label, toggle, i === (active ?? 0))}
            >
              <title>{label}</title>
              <circle cx={x} cy={y} r={13} fill="transparent" />
              <circle cx={x} cy={y} r={9} fill={point.color} opacity="0.15" />
              <circle
                cx={x}
                cy={y}
                r={3.5}
                fill={point.color}
                stroke={isActive ? point.color : "none"}
                strokeWidth={isActive ? 5 : 0}
                strokeOpacity={0.25}
              />
              <text
                x={x}
                y={y - 14}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(26,24,18,0.72)"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {point.name}
              </text>
            </g>
          );
        })}
      </svg>

      {activePoint && activePos && (
        <MapTooltip
          xPct={(activePos[0] / WIDTH) * 100}
          yPct={(activePos[1] / HEIGHT) * 100}
          accentColor={activePoint.color}
        >
          <p
            className="uppercase tracking-widest text-[9px] mb-1.5"
            style={{ color: activePoint.color }}
          >
            {activePoint.name} · {activePoint.label}
          </p>
          <p className="mb-2" style={{ color: "rgba(240,234,216,0.75)" }}>
            {RISK_EXPLAIN[activePoint.label]}
          </p>
          <p>{Math.round(activePoint.temperature)}°C</p>
          <p>{Math.round(activePoint.humidity)}% humedad</p>
          <p>{Math.round(activePoint.windSpeed)} km/h viento</p>
        </MapTooltip>
      )}
    </div>
  );
}
