/** Polar satellites whose detections reach the panel; the code travels as the optional 8th FirePoint value. */
export const FIRE_SATS = [
  { code: 0, id: "N20", label: "NOAA-20", sensor: "VIIRS", pixelM: 375 },
  { code: 1, id: "N21", label: "NOAA-21", sensor: "VIIRS", pixelM: 375 },
  { code: 2, id: "Terra", label: "Terra", sensor: "MODIS", pixelM: 1000 },
  { code: 3, id: "Aqua", label: "Aqua", sensor: "MODIS", pixelM: 1000 },
  { code: 4, id: "N", label: "Suomi NPP", sensor: "VIIRS", pixelM: 375 },
] as const;

export const satCode = (id: string | undefined) =>
  FIRE_SATS.find((s) => s.id === id)?.code;

export const satLabel = (code: number | undefined) =>
  FIRE_SATS.find((s) => s.code === code)?.label;

/** MODIS pixels are ~1 km: coarser and noisier than VIIRS, so the panel lets you leave them out. */
export const isModis = (code: number | undefined) =>
  code !== undefined &&
  FIRE_SATS.find((s) => s.code === code)?.sensor === "MODIS";
