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
import type { OpsEntry, UnitState } from "@/lib/admin/resources";
import type { MapHandle, ShowLayers } from "./map-view";

export interface SpreadInfo {
  near: string;
  wind: number;
  windDir: number;
  rh: number;
  temp: number;
  rain7d: number;
  rate: number;
  level: "bajo" | "moderado" | "alto" | "extremo";
  reachKm: number;
}

export type Tab =
  "general" | "zonas" | "drones" | "recursos" | "pronostico" | "metricas" | "config";

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

/** One point of the hourly series that drives the timeline charts. */
export interface HourPoint {
  t: number;
  count: number;
  frp: number;
  cum: number;
}

export interface KeyEvent {
  id: string;
  t: number;
  kind: "first" | "peak" | "frp" | "zone" | "sensor";
  title: string;
  sub?: string;
  at?: [number, number];
  featId?: string;
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

export interface Camera {
  bearing: number;
  pitch: number;
  zoom: number;
}

export interface Ctx {
  ws: Workspace;
  setSettings: (p: Partial<Settings>) => void;
  setMeta: (id: string, p: Partial<Meta>) => void;
  setFeatures: (f: Feat[]) => void;
  replaceWorkspace: (w: Workspace) => void;
  setNotes: (t: string) => void;
  payload: FiresPayload | null;
  firesError: string | null;
  loading: boolean;
  reload: () => void;
  fires: FirePoint[];
  stats: FireStats;
  clusters: FireCluster[];
  now: number;
  weather: Weather | null;
  map: RefObject<MapHandle | null>;
  tab: Tab;
  goTab: (t: Tab) => void;
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
  spreadInfo: SpreadInfo[];
  setPredH: (h: number) => void;
  feed: FeedItem[];
  rtb: Set<string>;
  toggleRtb: (id: string) => void;
  protectedHa: number;
  atRiskHa: number;
  exportCsv: () => void;
  exportReport: () => void;
  zoneRisk: Record<
    string,
    { score: number; label: string; color: string; wx: Weather }
  >;
  followId: string | null;
  setFollowId: (id: string | null) => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: boolean;
  canRedo: boolean;
  shareView: () => void;
  exportPng: () => void;

  // time cursor / playback
  range: { t0: number; t1: number };
  cursor: number | null;
  setCursor: (t: number | null) => void;
  playing: boolean;
  setPlaying: (v: boolean) => void;
  speed: number;
  setSpeed: (v: number) => void;
  series: HourPoint[];
  events: KeyEvent[];

  // view state
  view: "2d" | "3d";
  setView: (v: "2d" | "3d") => void;
  show: ShowLayers;
  setShow: (s: ShowLayers) => void;
  orbit: boolean;
  setOrbit: (v: boolean) => void;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
  camera: Camera;
  alertCount: number;

  // resources (simulated) and active drone
  units: UnitState[];
  dispatchUnit: (id: string, target: [number, number], label: string) => void;
  recallUnit: (id: string) => void;
  opsLog: OpsEntry[];
  activeDrone: string | null;
  setActiveDrone: (id: string | null) => void;
}
