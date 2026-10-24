"use client";

import { useMemo } from "react";
import type { LngLat } from "@/lib/engine/geo";

type Shape = LngLat[][][];

/**
 * The fire's own shape as a small SVG: the final perimeter faint and the
 * perimeter at the current moment filled.
 */
export function FireSilhouette({
  final,
  current,
  className,
  base = "var(--foreground)",
  accent = "var(--fire)",
}: {
  final: Shape;
  current: Shape | null;
  className?: string;
  base?: string;
  accent?: string;
}) {
  const paths = useMemo(() => {
    const pts = final.flat(2);
    if (!pts.length) return null;
    let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of pts) {
      w = Math.min(w, x);
      e = Math.max(e, x);
      s = Math.min(s, y);
      n = Math.max(n, y);
    }
    const k = Math.cos((((s + n) / 2) * Math.PI) / 180);
    const spanX = Math.max((e - w) * k, 1e-6);
    const spanY = Math.max(n - s, 1e-6);
    const scale = 100 / Math.max(spanX, spanY);
    const ox = (100 - spanX * scale) / 2;
    const oy = (100 - spanY * scale) / 2;
    const d = (shape: Shape) =>
      shape
        .flatMap((poly) =>
          poly.map(
            (ring) =>
              ring.map(([x, y], i) => `${i ? "L" : "M"}${(ox + (x - w) * k * scale).toFixed(1)} ${(oy + (n - y) * scale).toFixed(1)}`).join("") + "Z",
          ),
        )
        .join("");
    return { final: d(final), current: current ? d(current) : null };
  }, [final, current]);
  if (!paths) return null;
  return (
    <svg aria-hidden viewBox="-4 -4 108 108" className={className} fill="none">
      <path d={paths.final} fill={base} fillOpacity={0.04} stroke={base} strokeOpacity={0.22} strokeWidth={0.8} fillRule="evenodd" />
      {paths.current && <path d={paths.current} fill={accent} fillOpacity={0.2} stroke={accent} strokeOpacity={0.85} strokeWidth={1} fillRule="evenodd" />}
    </svg>
  );
}
