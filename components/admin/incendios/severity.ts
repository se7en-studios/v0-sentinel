// Burn severity from Sentinel-2 dNBR (USGS classes), as written by scripts/build-dnbr.ts
// into public/data/<case>/dnbr.json.

export type SeverityKey = "unburned" | "low" | "modLow" | "modHigh" | "high";

export interface DnbrStats {
  burnedHa: number;
  insidePerimeterHa: number;
  areasInsidePerimeterHa: Record<SeverityKey, number>;
  iou10: number;
  f1_10: number;
  iou27: number;
  validation: { dnbr010: { precision: number; recall: number } };
  perimeter: { unburnedPct: number };
  burnedOutsidePerimeterHa: number;
  maskedPct: number;
  scenes: { pre: { date: string }; post: { date: string } };
}

export const SEVERITY: { key: Exclude<SeverityKey, "unburned">; label: string; color: string }[] = [
  { key: "high", label: "Alta", color: "#8c1d04" },
  { key: "modHigh", label: "Moderada-alta", color: "#d9480f" },
  { key: "modLow", label: "Moderada-baja", color: "#f39c34" },
  { key: "low", label: "Baja", color: "#f6d55c" },
];
