import type { Map as MLMap } from "maplibre-gl";
import type { Wind } from "@/lib/admin/map-3d";
import type { EarlyView } from "@/lib/admin/early";
import type { FireInfo } from "@/lib/admin/noise";
import type { TerrainInfo } from "@/lib/admin/terrain";
import type {
  BaseLayer,
  Feat,
  FirePoint,
  Meta,
  OpacityKey,
  Region,
} from "@/lib/admin/types";

export interface DroneMarker {
  id: string;
  name: string;
  pos: [number, number];
  heading: number;
  selected: boolean;
  altitude: number;
}

export interface UnitMarker {
  id: string;
  name: string;
  kind: string;
  pos: [number, number];
}

export interface MapHandle {
  flyTo: (center: [number, number], zoom?: number) => void;
  fitFeature: (f: Feat) => void;
  resetNorth: () => void;
  getView: () => {
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
  } | null;
  snapshot: () => Promise<string | null>;
  getBounds: () => [number, number, number, number] | null;
  project: (lng: number, lat: number) => [number, number] | null;
  zoomBy: (delta: number) => void;
  /** Underlying map instance, for tools that draw their own overlay (measure). */
  getMap?: () => MLMap | null;
}

export interface ShowLayers {
  fires: boolean;
  /** GOES-19 early detections */
  early: boolean;
  heat: boolean;
  zones: boolean;
  lines: boolean;
  routes: boolean;
  sensors: boolean;
  drones: boolean;
  names: boolean;
  spread: boolean;
  forest: boolean;
  buildings: boolean;
}

export interface MapProps {
  baseLayer: BaseLayer;
  region: Region;
  view: "2d" | "3d";
  exaggeration: number;
  features: Feat[];
  meta: Record<string, Meta>;
  alertIds: Set<string>;
  fires: FirePoint[];
  /** classifier verdict per detection (score, industrial/static reason, fresh) for the popup */
  fireInfo?: Map<FirePoint, FireInfo>;
  /** GOES-19 early detections worth drawing (open or confirmed; industrial ones left out) */
  early?: EarlyView[];
  /** fuel and slope under a clicked detection, shown in its popup */
  terrainAt?: (lat: number, lng: number) => Promise<TerrainInfo | null>;
  spread: GeoJSON.FeatureCollection | null;
  orbit: boolean;
  follow: { pos: [number, number]; heading: number } | null;
  zoneRisk: Record<string, string>;
  opacity: Record<OpacityKey, number>;
  wind: Wind;
  dayLabels: string[];
  show: ShowLayers;
  tool: string | null;
  selectedId: string | null;
  editing: boolean;
  drones: DroneMarker[];
  unitMarkers?: UnitMarker[];
  units: "ha" | "km2";
  onSelect: (id: string | null) => void;
  onCreate: (f: Feat) => void;
  onEdited: (f: Feat) => void;
  onLive: (text: string | null) => void;
  onCenter: (c: [number, number]) => void;
  onCursor?: (c: [number, number] | null) => void;
  onCamera?: (c: { bearing: number; pitch: number; zoom: number }) => void;
  /** popup "Ver incidente": true when the point belongs to a detected incident */
  incidentAt?: (lat: number, lng: number) => boolean;
  onOpenIncident?: () => void;
}
