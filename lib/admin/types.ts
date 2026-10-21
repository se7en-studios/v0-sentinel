export type Role = "zone" | "line" | "route" | "sensor";
export type SensorType = "temp" | "humidity" | "smoke" | "wind";
export type BaseLayer = "esri" | "s2" | "viirs" | "light" | "topo";
export type OpacityKey = "imagery" | "relief" | "tint" | "fires" | "zones" | "spread" | "routes" | "labels";
export type Confidence = "l" | "n" | "h";

export interface Feat {
  id: string;
  type: "Feature";
  geometry: { type: string; coordinates: unknown };
  properties: Record<string, unknown>;
}

export interface Meta {
  name: string;
  droneId?: string;
  sensorType?: SensorType;
}

/** User-defined alert: fires a toast (and optional browser notification) when its condition turns true. */
export type AlertRule = { id: string; enabled: boolean } & (
  | { kind: "zone_fire"; zoneId: string; min: number } // zoneId "" = any zone
  | { kind: "risk"; score: number; days: number }
  | { kind: "activity"; focos: number }
);

export interface Settings {
  org: string;
  regionId: string;
  baseLayer: BaseLayer;
  minConfidence: Confidence;
  bufferKm: number;
  units: "ha" | "km2";
  exaggeration: number;
  refreshMin: number;
  valuePerHa: number;
  opacity: Record<OpacityKey, number>;
  thresholds: { temp: number; humidity: number; smoke: number; wind: number };
  rules: AlertRule[];
  notify: {
    email: string;
    whatsapp: string;
    onZoneHit: boolean;
    onSensor: boolean;
    browser: boolean;
  };
}

export interface Workspace {
  features: Feat[];
  meta: Record<string, Meta>;
  settings: Settings;
  notes: string;
}

// [lat, lng, frp, confidence 0|1|2, dayIdx, hhmm, isNight 0|1]
export type FirePoint = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface FireCluster {
  lat: number;
  lng: number;
  count: number;
  frp: number;
  near: string;
  km: number;
}

export interface FiresPayload {
  updated: string;
  days: string[];
  points: FirePoint[];
  clusters: FireCluster[];
  error?: string;
}

export const MODE_ROLE: Record<string, Role> = {
  "zone-polygon": "zone",
  "zone-circle": "zone",
  "zone-rect": "zone",
  "zone-free": "zone",
  line: "line",
  route: "route",
  sensor: "sensor",
};

export const ROLE_COLOR: Record<Role, string> = {
  zone: "#0f7a4f",
  line: "#1b6fb8",
  route: "#e8710a",
  sensor: "#0e9aa7",
};

export const SENSOR_LABEL: Record<SensorType, { label: string; unit: string }> =
  {
    temp: { label: "Temperatura", unit: "°C" },
    humidity: { label: "Humedad", unit: "%" },
    smoke: { label: "Humo / CO", unit: "ppm" },
    wind: { label: "Viento", unit: "km/h" },
  };

export interface Region {
  id: string;
  name: string;
  center: [number, number];
  zoom: number;
}

export const REGIONS: Region[] = [
  { id: "ar", name: "Argentina completa", center: [-65, -38], zoom: 3.6 },
  {
    id: "patagonia-andina",
    name: "Patagonia Andina (Bariloche - El Bolsón)",
    center: [-71.5, -41.6],
    zoom: 8.6,
  },
  {
    id: "chubut",
    name: "Chubut cordillerano (Esquel - Cholila)",
    center: [-71.5, -42.9],
    zoom: 8.6,
  },
  {
    id: "neuquen",
    name: "Neuquén (Villa La Angostura - San Martín)",
    center: [-71.2, -40.4],
    zoom: 8.4,
  },
  {
    id: "cordoba",
    name: "Sierras de Córdoba",
    center: [-64.6, -31.8],
    zoom: 8,
  },
  {
    id: "corrientes",
    name: "Esteros del Iberá (Corrientes)",
    center: [-57.4, -28.4],
    zoom: 7.6,
  },
  { id: "delta", name: "Delta del Paraná", center: [-60.5, -33.5], zoom: 7.4 },
  {
    id: "mendoza",
    name: "Mendoza - San Rafael",
    center: [-68.6, -34.6],
    zoom: 7.4,
  },
];

export const DEFAULT_SETTINGS: Settings = {
  org: "Sentinel Technologies",
  regionId: "patagonia-andina",
  baseLayer: "esri",
  minConfidence: "n",
  bufferKm: 5,
  units: "ha",
  exaggeration: 2,
  refreshMin: 30,
  valuePerHa: 0,
  opacity: { imagery: 1, relief: 0.6, tint: 0.3, fires: 1, zones: 1, spread: 1, routes: 1, labels: 1 },
  thresholds: { temp: 45, humidity: 20, smoke: 150, wind: 50 },
  rules: [],
  notify: { email: "", whatsapp: "", onZoneHit: true, onSensor: true, browser: false },
};
