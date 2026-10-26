import type { RefObject } from "react";
import type {
  Feat,
  FireCluster,
  FirePoint,
  FiresPayload,
  Meta,
  NoteEntry,
  Role,
  SensorType,
  Settings,
  SourceStatus,
  Workspace,
} from "@/lib/admin/types";
import type { EarlyView } from "@/lib/admin/early";
import type { TerrainInfo } from "@/lib/admin/terrain";
import type { Translate } from "@/lib/admin/i18n";
import type { DroneSpec } from "@/lib/admin/sim";
import type { AckMap } from "@/lib/admin/alert-ack";
import type {
  IncidentMetaMap,
  IncidentStatus,
} from "@/lib/admin/incident-meta";
import type { Weather, WeatherStatus } from "@/lib/admin/weather";
import type { DayForecast } from "@/lib/admin/forecast";
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
  /** typical reach (median of the backtest) at the chosen horizon */
  reachKm: number;
  /** outer reach (90th percentile of the backtest) at the same horizon */
  reachMaxKm: number;
  /** land cover under the incident center, when the terrain lookup answered */
  fuel?: string;
  /** slope in degrees, when known */
  slopeDeg?: number;
}

export type PanelSeg = "Capas" | "Análisis" | "Alertas" | "Notas";

export type Tab =
  | "general"
  | "incendios"
  | "zonas"
  | "drones"
  | "recursos"
  | "pronostico"
  | "incidentes"
  | "metricas"
  | "config";

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
  /** text in the interface language (Spanish when a key is missing) */
  t: Translate;
  noteLog: NoteEntry[];
  addNote: (text: string, featId?: string) => void;
  removeNote: (id: string) => void;
  alertAck: AckMap;
  /** acknowledge a zone alert; with snoozeMin it also stays quiet that long (new detections re-open it) */
  ackZoneAlert: (
    featId: string,
    detections: number,
    snoozeMin?: number,
  ) => void;
  reopenZoneAlert: (featId: string) => void;
  /** rule firings nobody has acknowledged or snoozed */
  unackedRules: number;
  /** acknowledge a firing rule for snoozeMin minutes (24 h by default) */
  ackRule: (ruleId: string, snoozeMin?: number) => void;
  reopenRule: (ruleId: string) => void;
  /** open early detections nobody has acknowledged or snoozed */
  earlyPending: EarlyView[];
  /** acknowledge an early detection for snoozeMin minutes (24 h by default); the badge, strip and toasts skip it */
  ackEarly: (e: { lat: number; lng: number }, snoozeMin?: number) => void;
  reopenEarly: (e: { lat: number; lng: number }) => void;
  incidentMeta: IncidentMetaMap;
  /** set the status and/or assignee of a detected incident; the author and time are filled in */
  updateIncident: (
    id: string,
    patch: { status?: IncidentStatus; assignee?: string },
  ) => void;
  payload: FiresPayload | null;
  /** GOES-19 early detections resolved against the polar passes (open, confirmed or industrial) */
  early: EarlyView[];
  /** open ones that are still showing: what needs a look */
  earlyOpen: EarlyView[];
  /** open early detections inside (or within the alert radius of) each zone */
  earlyByZone: Record<string, EarlyView[]>;
  earlyError: string | null;
  /** land cover, elevation and slope under a point (null when it cannot be read) */
  terrainAt: (lat: number, lng: number) => Promise<TerrainInfo | null>;
  /** fetch that adds the session token (when signed in) for the admin API routes */
  authedFetch: (url: string, init?: RequestInit) => Promise<Response>;
  /** incident picked in the Incidents view (set by the map popup's "Ver incidente") */
  incidentSel: string | null;
  setIncidentSel: (id: string | null) => void;
  /** every data feed, polar and geostationary, with its newest acquisition (for the latency table) */
  sources: SourceStatus[];
  /** ms epoch of the last early-warning pull, 0 before the first */
  earlyFetchedAt: number;
  firesError: string | null;
  loading: boolean;
  reload: () => void;
  fires: FirePoint[];
  stats: FireStats;
  clusters: FireCluster[];
  now: number;
  weather: Weather | null;
  weatherStatus: WeatherStatus;
  retryWeather: () => void;
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
  exportWeekly: () => Promise<void>;
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
  ruleFirings: Map<string, string>;
  forecast: DayForecast[] | null;
  /** every detection that passes the confidence and noise filters, regardless of the timeline */
  allFires: FirePoint[];
  /** detections held back as likely industrial heat (0 when the filter is off) */
  noiseCount: number;
  /** ms epoch of the newest detection received, 0 when none */
  lastDetection: number;
  panelSeg: PanelSeg;
  setPanelSeg: (s: PanelSeg) => void;

  // resources (simulated) and active drone
  units: UnitState[];
  dispatchUnit: (id: string, target: [number, number], label: string) => void;
  recallUnit: (id: string) => void;
  opsLog: OpsEntry[];
  activeDrone: string | null;
  setActiveDrone: (id: string | null) => void;
}
