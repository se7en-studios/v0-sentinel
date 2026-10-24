/** VIIRS platforms as FIRMS names them: S-NPP, NOAA-20, NOAA-21. */
export type Satellite = "N" | "N20" | "N21";

export const SATELLITE_LABEL: Record<Satellite, string> = {
  N: "S-NPP",
  N20: "NOAA-20",
  N21: "NOAA-21",
};

/** One VIIRS 375 m active-fire pixel. */
export interface Detection {
  lat: number;
  lng: number;
  /** acquisition time, ms since epoch (UTC) */
  t: number;
  sat: Satellite;
  /** FIRMS confidence: low / nominal / high */
  conf: "l" | "n" | "h";
  /** fire radiative power, MW */
  frp: number;
  day: boolean;
  /** pixel size in km along scan and along track (0.375 at nadir, ~0.8 at the edge) */
  scan: number;
  track: number;
}
