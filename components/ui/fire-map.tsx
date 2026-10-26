"use client";

import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath, geoCentroid, geoContains } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import countriesGeoJson from "@/data/latam-countries.json";
import { MapTooltip, mapPointProps } from "@/components/ui/map-tooltip";

export interface FirePoint {
  lat: number;
  lng: number;
  confidence?: string;
  acqDate?: string;
  acqTime?: string;
  frp?: number;
}

export interface FireMapProps {
  points?: FirePoint[];
  pointColor?: string;
}

const WIDTH = 560;
const HEIGHT = 700;
const countries = countriesGeoJson as FeatureCollection<
  Geometry,
  { name: string }
>;

// ponytail: plain-language labels — "gente comun" reading a satellite feed
// doesn't know what VIIRS confidence codes or MW of radiative power mean.
const CONFIDENCE_LABEL: Record<string, string> = {
  l: "Baja",
  n: "Media",
  h: "Alta",
  low: "Baja",
  nominal: "Media",
  high: "Alta",
};

function formatConfidence(c?: string) {
  if (!c) return "-";
  return CONFIDENCE_LABEL[c.toLowerCase()] ?? c;
}

function frpIntensity(frp?: number) {
  if (frp === undefined) return undefined;
  if (frp < 10) return "Foco chico";
  if (frp < 50) return "Foco moderado";
  if (frp < 150) return "Foco grande";
  return "Foco muy intenso";
}

function hoursAgo(acqDate?: string, acqTime?: string) {
  if (!acqDate || !acqTime) return undefined;
  const hh = acqTime.padStart(4, "0").slice(0, 2);
  const mm = acqTime.padStart(4, "0").slice(2);
  const detected = new Date(`${acqDate}T${hh}:${mm}:00Z`);
  if (Number.isNaN(detected.getTime())) return undefined;
  const diffH = Math.round((Date.now() - detected.getTime()) / 36e5);
  if (diffH <= 0) return "hace instantes";
  if (diffH === 1) return "hace 1 hora";
  return `hace ${diffH} horas`;
}

function formatDate(acqDate?: string, acqTime?: string) {
  if (!acqDate) return "-";
  const time =
    acqTime && acqTime.length >= 3
      ? `${acqTime.padStart(4, "0").slice(0, 2)}:${acqTime
          .padStart(4, "0")
          .slice(2)} UTC`
      : "";
  return `${acqDate}${time ? ` · ${time}` : ""}`;
}

export function FireMap({ points = [], pointColor = "#b83a3a" }: FireMapProps) {
  // ponytail: gates the infinite SMIL <animate> pulses below — starts false
  // to match SSR, then syncs on mount to avoid a hydration mismatch.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activePoint, setActivePoint] = useState<number | null>(null);

  // Tag each point with the country it falls in, once — independent of zoom.
  const taggedPoints = useMemo(() => {
    return points.map((p) => {
      const country = countries.features.find((f) =>
        geoContains(f, [p.lng, p.lat]),
      );
      return { ...p, country: country?.properties.name };
    });
  }, [points]);

  const countryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of taggedPoints) {
      if (!p.country) continue;
      counts.set(p.country, (counts.get(p.country) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [taggedPoints]);

  const selectedFeature = useMemo(
    () =>
      selectedCountry
        ? countries.features.find((f) => f.properties.name === selectedCountry)
        : null,
    [selectedCountry],
  );

  const visiblePoints = useMemo(
    () =>
      selectedCountry
        ? taggedPoints.filter((p) => p.country === selectedCountry)
        : taggedPoints,
    [taggedPoints, selectedCountry],
  );

  const { pathFor, project, labels } = useMemo(() => {
    const extentTarget:
      | FeatureCollection<Geometry, { name: string }>
      | Feature<Geometry, { name: string }> = selectedFeature ?? countries;
    const projection = geoMercator().fitExtent(
      [
        [16, 16],
        [WIDTH - 16, HEIGHT - 16],
      ],
      extentTarget,
    );
    const path = geoPath(projection);

    // ponytail: d3's trig-heavy projection math can land on a different
    // last-decimal float between the server's and the browser's V8, which
    // React then flags as a hydration mismatch even though it's visually
    // identical. Rounding to hundredths (invisible at this scale) makes the
    // serialized string stable across both renders.
    const round = (n: number) => Math.round(n * 100) / 100;

    const provinceLabels: { name: string; x: number; y: number }[] = [];
    for (const feature of countries.features) {
      if (selectedFeature && feature.properties.name !== selectedCountry)
        continue;
      const [x, y] = projection(geoCentroid(feature)) ?? [0, 0];
      provinceLabels.push({
        name: feature.properties.name,
        x: round(x),
        y: round(y),
      });
    }

    return {
      pathFor: (feature: (typeof countries.features)[number]) =>
        path(feature) ?? "",
      project: (lat: number, lng: number): [number, number] => {
        const [x, y] = projection([lng, lat]) ?? [0, 0];
        return [round(x), round(y)];
      },
      labels: provinceLabels,
    };
  }, [selectedFeature, selectedCountry]);

  const active = activePoint !== null ? visiblePoints[activePoint] : undefined;
  const activePos = active ? project(active.lat, active.lng) : null;

  return (
    <div className="w-full">
      <div
        className="w-full bg-[#f1ede3] rounded-lg relative font-sans"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-full [mask-image:linear-gradient(to_bottom,transparent,white_4%,white_96%,transparent)]"
          onClick={() => setActivePoint(null)}
          role="group"
          aria-label={`Mapa de focos de calor detectados por satélite: ${visiblePoints.length} focos. Usá las flechas para recorrerlos y Enter para ver el detalle.`}
        >
          {countries.features.map((feature, i) => (
            <path
              key={`country-${i}`}
              d={pathFor(feature)}
              fill={
                feature.properties.name === selectedCountry
                  ? "#1a181212"
                  : "#1a181208"
              }
              stroke="rgba(26,24,18,0.2)"
              strokeWidth={0.75}
            />
          ))}

          {labels.map((label) => (
            <text
              key={label.name}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              fontSize={selectedFeature ? 11 : 7}
              fill="rgba(26,24,18,0.66)"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {label.name}
            </text>
          ))}

          {visiblePoints.map((point, i) => {
            const [x, y] = project(point.lat, point.lng);
            const isActive = i === activePoint;
            const toggle = () => setActivePoint(isActive ? null : i);
            const label = [
              "Foco de calor",
              point.country,
              frpIntensity(point.frp),
              formatDate(point.acqDate, point.acqTime),
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <g
                key={`fire-${i}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
                style={{ cursor: "pointer" }}
                aria-pressed={isActive}
                {...mapPointProps(label, toggle, i === (activePoint ?? 0))}
              >
                <title>{label}</title>
                {/* generous invisible hit target — the visible dot is tiny */}
                <circle cx={x} cy={y} r={9} fill="transparent" />
                <circle cx={x} cy={y} r={2.5} fill={pointColor} />
                <circle
                  cx={x}
                  cy={y}
                  r={2.5}
                  fill="none"
                  stroke={pointColor}
                  strokeWidth={isActive ? 1.5 : 0}
                  opacity={0.9}
                >
                  {isActive && (
                    <animate
                      attributeName="r"
                      from={2.5}
                      to={7}
                      dur="0.6s"
                      repeatCount="1"
                      fill="freeze"
                    />
                  )}
                </circle>
                <circle cx={x} cy={y} r={2.5} fill={pointColor} opacity="0.5">
                  {!reducedMotion && (
                    <>
                      <animate
                        attributeName="r"
                        from={2.5}
                        to={10}
                        dur="1.8s"
                        begin={`${(i % 5) * 0.3}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.5"
                        to="0"
                        dur="1.8s"
                        begin={`${(i % 5) * 0.3}s`}
                        repeatCount="indefinite"
                      />
                    </>
                  )}
                </circle>
              </g>
            );
          })}
        </svg>

        {active && activePos && (
          <MapTooltip
            xPct={(activePos[0] / WIDTH) * 100}
            yPct={(activePos[1] / HEIGHT) * 100}
            accentColor={pointColor}
          >
            <p
              className="uppercase tracking-widest text-[9px] mb-1.5"
              style={{ color: pointColor }}
            >
              {active.country ?? "Foco detectado"}
            </p>
            {frpIntensity(active.frp) && (
              <p
                className="text-[12px] mb-1"
                style={{
                  fontWeight: 600,
                  color: "rgba(240,234,216,0.95)",
                }}
              >
                {frpIntensity(active.frp)}
                {active.frp !== undefined && (
                  <span style={{ color: "rgba(240,234,216,0.5)" }}>
                    {" "}
                    · {active.frp.toFixed(0)} MW
                  </span>
                )}
              </p>
            )}
            <p>Certeza del dato: {formatConfidence(active.confidence)}</p>
            <p>{formatDate(active.acqDate, active.acqTime)}</p>
            {hoursAgo(active.acqDate, active.acqTime) && (
              <p style={{ color: "rgba(240,234,216,0.5)" }}>
                {hoursAgo(active.acqDate, active.acqTime)}
              </p>
            )}
          </MapTooltip>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={() => {
            setSelectedCountry(null);
            setActivePoint(null);
          }}
          className="px-3 py-1.5 rounded-sm text-[10px] tracking-wide uppercase transition-colors"
          style={{
            fontFamily: "var(--font-sans)",
            background: !selectedCountry
              ? "rgba(15,122,79,0.12)"
              : "transparent",
            border: `0.5px solid ${
              !selectedCountry ? "rgba(15,122,79,0.4)" : "rgba(26,24,18,0.15)"
            }`,
            color: !selectedCountry ? "var(--green-aa)" : "var(--muted-foreground)",
          }}
        >
          Toda la región
        </button>
        {countryCounts.map(([name, count]) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setSelectedCountry(name);
              setActivePoint(null);
            }}
            className="px-3 py-1.5 rounded-sm text-[10px] tracking-wide uppercase transition-colors"
            style={{
              fontFamily: "var(--font-sans)",
              background:
                selectedCountry === name
                  ? "rgba(15,122,79,0.12)"
                  : "transparent",
              border: `0.5px solid ${
                selectedCountry === name
                  ? "rgba(15,122,79,0.4)"
                  : "rgba(26,24,18,0.15)"
              }`,
              color:
                selectedCountry === name ? "var(--green-aa)" : "var(--muted-foreground)",
            }}
          >
            {name} · {count}
          </button>
        ))}
      </div>
    </div>
  );
}
