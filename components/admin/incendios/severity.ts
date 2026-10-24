// Burn severity from Sentinel-2 dNBR (USGS classes), as written by scripts/build-dnbr.ts
// into public/data/<case>/dnbr.json.

import type { MsgKey } from "@/lib/admin/i18n";

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

export const SEVERITY: { key: Exclude<SeverityKey, "unburned">; labelKey: MsgKey; color: string }[] = [
  { key: "high", labelKey: "trk.sev.high", color: "#8c1d04" },
  { key: "modHigh", labelKey: "trk.sev.modHigh", color: "#d9480f" },
  { key: "modLow", labelKey: "trk.sev.modLow", color: "#f39c34" },
  { key: "low", labelKey: "trk.sev.low", color: "#f6d55c" },
];
