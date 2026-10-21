import type { RefObject } from "react";
import type {
  Feat,
  FireCluster,
  FirePoint,
  FiresPayload,
  Meta,
  Role,
  SensorType,
  Settings,
  Workspace,
} from "@/lib/admin/types";
import type { DroneSpec } from "@/lib/admin/sim";
import type { Weather } from "@/lib/admin/weather";
import type { MapHandle } from "./map-view";

export type Tab = "general" | "zonas" | "drones" | "metricas" | "config";

export interface FireStats {
  total: number;
  last24: number;
  frp: number;
  hectares: number;
  perDay: { day: string; label: string; count: number; frp: number }[];
  perHour: { hour: number; count: number }[];
  byConf: { name: string; value: number }[];
  night: number;
  day: number;
}

export interface DroneState {
  spec: DroneSpec;
  route?: Feat;
  telem: {
    battery: number;
    altitude: number;
    speed: number;
    signal: number;
    distKm: number;
  };
  track: {
    pos: [number, number];
    heading: number;
    progress: number;
    total: number;
  } | null;
}

export interface SensorState {
  feat: Feat;
  meta: Meta;
  type: SensorType;
  reading: { value: number; unit: string; alert: boolean };
  fireKm: number | null;
}

export interface Ctx {
  ws: Workspace;
  setSettings: (p: Partial<Settings>) => void;
  setMeta: (id: string, p: Partial<Meta>) => void;
  setFeatures: (f: Feat[]) => void;
  replaceWorkspace: (w: Workspace) => void;
  payload: FiresPayload | null;
  firesError: string | null;
  loading: boolean;
  reload: () => void;
  fires: FirePoint[];
  stats: FireStats;
  clusters: FireCluster[];
  dayFilter: number | null;
  setDayFilter: (d: number | null) => void;
  now: number;
  weather: Weather | null;
  map: RefObject<MapHandle | null>;
  tab: Tab;
  tool: string | null;
  setTool: (t: string | null) => void;
  selectedId: string | null;
  select: (id: string | null) => void;
  editing: boolean;
  setEditing: (v: boolean) => void;
  addFeature: (f: Feat, role?: Role) => void;
  removeFeature: (id: string) => void;
  zoneHits: Record<string, { recent: number; total: number; last: number }>;
  drones: DroneState[];
  sensors: SensorState[];
  center: [number, number];
  loadDemo: () => void;
  hours: number;
  setHours: (h: number) => void;
  predH: number;
  setPredH: (h: number) => void;
  feed: FeedItem[];
  rtb: Set<string>;
  toggleRtb: (id: string) => void;
  protectedHa: number;
  atRiskHa: number;
  exportCsv: () => void;
  exportReport: () => void;
  zoneRisk: Record<string, { score: number; label: string; color: string; wx: Weather }>;
  followId: string | null;
  setFollowId: (id: string | null) => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: boolean;
  canRedo: boolean;
  shareView: () => void;
  exportPng: () => void;
}

export interface FeedItem {
  id: string;
  t: number;
  kind: "fire" | "zone" | "sensor" | "drone";
  title: string;
  sub: string;
  at?: [number, number];
  featId?: string;
  sim?: boolean;
}
