import type { LandCover } from "./track";

/** ESA WorldCover 2021 v200 classes → our land-cover groups. */
export const WORLDCOVER: Record<number, { label: string; group: LandCover }> = {
  10: { label: "Bosque", group: "bosque" },
  20: { label: "Arbustal", group: "arbustal" },
  30: { label: "Pastizal", group: "pastizal" },
  40: { label: "Cultivo", group: "cultivo" },
  50: { label: "Urbano", group: "urbano" },
  60: { label: "Suelo desnudo", group: "otro" },
  70: { label: "Nieve y hielo", group: "otro" },
  80: { label: "Agua", group: "otro" },
  90: { label: "Humedal", group: "otro" },
  95: { label: "Manglar", group: "bosque" },
  100: { label: "Musgo y liquen", group: "otro" },
};

export const COVER_LABEL: Record<LandCover, string> = {
  bosque: "Bosque",
  arbustal: "Arbustal",
  pastizal: "Pastizal",
  cultivo: "Cultivo",
  urbano: "Urbano",
  otro: "Otro",
};

export interface CoverRaster {
  /** west, south, east, north */
  bbox: [number, number, number, number];
  width: number;
  height: number;
  data: Uint8Array;
}

/**
 * Land-cover lookup for a VIIRS pixel: the majority WorldCover group within
 * radiusM of the detection (a 375 m pixel sees a mix, not a point).
 */
export function coverSampler(r: CoverRaster, radiusM = 187.5) {
  const [w, s, e, n] = r.bbox;
  const dx = (e - w) / r.width;
  const dy = (n - s) / r.height;
  return (lat: number, lng: number): LandCover | undefined => {
    const ci = Math.floor((lng - w) / dx);
    const cj = Math.floor((n - lat) / dy);
    if (ci < 0 || cj < 0 || ci >= r.width || cj >= r.height) return undefined;
    const ki = Math.max(0, Math.round(radiusM / (dx * 111_320 * Math.cos((lat * Math.PI) / 180))));
    const kj = Math.max(0, Math.round(radiusM / (dy * 110_574)));
    const votes = new Map<LandCover, number>();
    for (let j = cj - kj; j <= cj + kj; j++)
      for (let i = ci - ki; i <= ci + ki; i++) {
        if (i < 0 || j < 0 || i >= r.width || j >= r.height) continue;
        const g = WORLDCOVER[r.data[j * r.width + i]]?.group;
        if (g) votes.set(g, (votes.get(g) ?? 0) + 1);
      }
    let best: LandCover | undefined;
    let bestN = 0;
    for (const [g, v] of votes) if (v > bestN) [best, bestN] = [g, v];
    return best;
  };
}
