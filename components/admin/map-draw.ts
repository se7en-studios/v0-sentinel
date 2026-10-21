import type { Map as MLMap } from "maplibre-gl";
import {
  TerraDraw,
  TerraDrawCircleMode,
  TerraDrawFreehandMode,
  TerraDrawLineStringMode,
  TerraDrawPointMode,
  TerraDrawPolygonMode,
  TerraDrawRectangleMode,
  TerraDrawRenderMode,
  TerraDrawSelectMode,
} from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { areaHa, fmtArea, fmtKm, lengthKm } from "@/lib/admin/geo";
import { ROLE_COLOR, type Feat, type Role } from "@/lib/admin/types";

type Hex = `#${string}`;

export interface DrawHandlers {
  onCreate: (f: Feat) => void;
  onEdited: (f: Feat) => void;
  onLive: (text: string | null) => void;
  units: () => "ha" | "km2";
}

const zoneStyles = (color: string) => ({
  fillColor: color as Hex,
  fillOpacity: 0.22,
  outlineColor: "#ffffff" as Hex,
  outlineWidth: 3,
});

const selectFlags = (role: Role, resizable = false) => ({
  feature: {
    draggable: true,
    rotateable: role !== "sensor",
    scaleable: role !== "sensor",
    coordinates:
      role === "sensor"
        ? undefined
        : {
            midpoints: !resizable,
            draggable: true,
            deletable: true,
            resizable: resizable ? ("center-fixed" as const) : undefined,
          },
  },
});

/**
 * Terra Draw only creates new shapes and edits the selected one; everything
 * saved is rendered by our own layers so styling and 3D stay under our control.
 */
export function createDraw(map: MLMap, h: DrawHandlers) {
  const zone = ROLE_COLOR.zone;
  const draw = new TerraDraw({
    adapter: new TerraDrawMapLibreGLAdapter({ map }),
    modes: [
      new TerraDrawRenderMode({
        modeName: "render",
        styles: { pointColor: "#ffffff" as Hex },
      }),
      new TerraDrawPolygonMode({
        modeName: "zone-polygon",
        styles: { ...zoneStyles(zone), closingPointColor: "#ffffff" as Hex },
      }),
      new TerraDrawCircleMode({
        modeName: "zone-circle",
        projection: "globe",
        styles: zoneStyles(zone),
      }),
      new TerraDrawRectangleMode({
        modeName: "zone-rect",
        styles: zoneStyles(zone),
      }),
      new TerraDrawFreehandMode({
        modeName: "zone-free",
        styles: zoneStyles(zone),
      }),
      new TerraDrawLineStringMode({
        modeName: "line",
        styles: { lineStringColor: ROLE_COLOR.line as Hex, lineStringWidth: 4 },
      }),
      new TerraDrawLineStringMode({
        modeName: "route",
        styles: {
          lineStringColor: ROLE_COLOR.route as Hex,
          lineStringWidth: 4,
        },
      }),
      new TerraDrawPointMode({
        modeName: "sensor",
        styles: {
          pointColor: ROLE_COLOR.sensor as Hex,
          pointWidth: 8,
          pointOutlineColor: "#ffffff" as Hex,
          pointOutlineWidth: 2,
        },
      }),
      new TerraDrawSelectMode({
        modeName: "select",
        flags: {
          "zone-polygon": selectFlags("zone"),
          "zone-circle": selectFlags("zone", true),
          "zone-rect": selectFlags("zone", true),
          "zone-free": selectFlags("zone"),
          line: selectFlags("line"),
          route: selectFlags("route"),
          sensor: selectFlags("sensor"),
        },
      }),
    ],
  });
  draw.start();
  draw.setMode("render");

  draw.on("finish", (id, ctx) => {
    const snap = draw.getSnapshotFeature(id);
    if (!snap) return;
    const f = { ...snap, id: String(snap.id) } as unknown as Feat;
    if (ctx.action === "draw") {
      draw.removeFeatures([id]);
      h.onLive(null);
      h.onCreate(f);
    } else {
      h.onEdited(f);
    }
  });

  draw.on("change", (ids, type) => {
    if (type !== "update" && type !== "create") return;
    const s = draw.getSnapshotFeature(ids[0]);
    if (!s?.properties.currentlyDrawing) return;
    const f = { ...s, id: String(s.id) } as unknown as Feat;
    try {
      h.onLive(
        s.geometry.type === "LineString"
          ? `Largo ${fmtKm(lengthKm(f))}`
          : s.geometry.type === "Polygon"
            ? `Área ${fmtArea(areaHa(f), h.units())}`
            : null,
      );
    } catch {
      /* geometry still degenerate while drawing */
    }
  });

  return draw;
}
