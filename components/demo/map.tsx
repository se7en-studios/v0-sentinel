import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { project, unproject, type Proj } from "@/lib/demo/geo";

/** What the page hands to the client: the outline path and its projection (the 60 kB geojson stays on the server). */
export interface DemoGeo {
  path: string;
  proj: Proj;
}

export const delayStyle = (s: number): CSSProperties =>
  ({ "--d": `${s.toFixed(2)}s` }) as CSSProperties;

/** Argentina drawn as one SVG path. Children are drawn in the same coordinates as `project`. */
export function ArgentinaMap({
  geo,
  label,
  small,
  onPick,
  children,
}: {
  geo: DemoGeo;
  label: string;
  small?: boolean;
  /** called with the picked [lon, lat] when the map is clicked (a pointer shortcut; buttons cover the keyboard) */
  onPick?: (lon: number, lat: number) => void;
  children?: ReactNode;
}) {
  const { w, h } = geo.proj;
  const pick = (e: MouseEvent<SVGSVGElement>) => {
    if (!onPick) return;
    const r = e.currentTarget.getBoundingClientRect();
    const [lon, lat] = unproject(
      geo.proj,
      ((e.clientX - r.left) / r.width) * w,
      ((e.clientY - r.top) / r.height) * h,
    );
    onPick(lon, lat);
  };
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
      className={`d-map${small ? " d-map--sm" : ""}${onPick ? " d-map--pick" : ""}`}
      style={{ aspectRatio: `${w} / ${h}` }}
      onClick={pick}
    >
      <path d={geo.path} className="d-land" />
      {children}
    </svg>
  );
}

/** Position of a sample point on the map. */
export const at = (geo: DemoGeo, lon: number, lat: number) =>
  project(geo.proj, lon, lat);

/** Heat dot. `delay` is when it shows up (seconds); with reduced motion it is simply there. */
export function HeatDot({
  x,
  y,
  delay = 0,
  kind = "fire",
}: {
  x: number;
  y: number;
  delay?: number;
  kind?: "fire" | "noise-hot";
}) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      {kind === "fire" && (
        <circle r="8" className="d-halo" style={delayStyle(delay + 0.4)} />
      )}
      <circle
        r="3.6"
        className={`d-dot${kind === "fire" ? " d-pop" : " d-hot-out"}`}
        style={delayStyle(delay)}
      />
    </g>
  );
}

/** Dashed ring for heat that Sentinel set aside; shape (not only colour) tells it apart from fire. */
export function NoiseMark({
  x,
  y,
  delay,
}: {
  x: number;
  y: number;
  delay: number;
}) {
  return (
    <g
      transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
      className="d-cold-in"
      style={delayStyle(delay)}
    >
      <circle r="5" className="d-ring" />
      <path d="M-3 3L3 -3" className="d-ring-x" />
    </g>
  );
}
