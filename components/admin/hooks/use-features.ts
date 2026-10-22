import {
  useCallback,
  useEffect,
  useState,
  type RefObject,
} from "react";
import { toast } from "sonner";
import { demoWorkspace } from "@/lib/admin/demo";
import {
  MODE_ROLE,
  REGIONS,
  type Feat,
  type Region,
  type Role,
  type Workspace,
} from "@/lib/admin/types";
import type { Ctx } from "../ctx";
import type { MapHandle } from "../map-view";

const NAME_PREFIX: Record<Role, string> = {
  zone: "Zona",
  line: "Línea",
  route: "Ruta",
  sensor: "Sensor",
};

interface Params {
  ws: Workspace;
  region: Region;
  mapRef: RefObject<MapHandle | null>;
  setFeatures: Ctx["setFeatures"];
  setMeta: Ctx["setMeta"];
  replace: Ctx["replaceWorkspace"];
  undo: Ctx["undo"];
  setView: (v: "2d" | "3d") => void;
}

/** Drawing tool, selection and editing of zones/lines/routes/sensors. */
export function useFeatures({
  ws,
  region,
  mapRef,
  setFeatures,
  setMeta,
  replace,
  undo,
  setView,
}: Params) {
  const [tool, setToolRaw] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditingRaw] = useState(false);
  const [live, setLive] = useState<string | null>(null);

  const addFeature = useCallback(
    (f: Feat, roleIn?: Role) => {
      const role = roleIn ?? MODE_ROLE[String(f.properties.mode)] ?? "zone";
      const n =
        ws.features.filter(
          (x) => (MODE_ROLE[String(x.properties.mode)] ?? "zone") === role,
        ).length + 1;
      setFeatures([...ws.features, f]);
      setMeta(f.id, {
        name: `${NAME_PREFIX[role]} ${n}`,
        ...(role === "sensor"
          ? {
              sensorType: (["temp", "humidity", "smoke", "wind"] as const)[
                (n - 1) % 4
              ],
            }
          : {}),
      });
      setSelectedId(f.id);
      toast.success(`${NAME_PREFIX[role]} creada`, {
        description: "Podés renombrarla en el panel lateral.",
      });
    },
    [ws.features, setFeatures, setMeta],
  );

  const removeFeature = useCallback(
    (id: string) => {
      setFeatures(ws.features.filter((f) => f.id !== id));
      toast("Elemento eliminado", {
        action: { label: "Deshacer", onClick: () => undo() },
      });
      setSelectedId((cur) => (cur === id ? null : cur));
      setEditingRaw(false);
    },
    [ws.features, setFeatures, undo],
  );

  const onEdited = useCallback(
    (f: Feat) =>
      setFeatures(
        ws.features.map((x) =>
          x.id === f.id ? { ...x, geometry: f.geometry } : x,
        ),
      ),
    [ws.features, setFeatures],
  );

  const loadDemo = useCallback(() => {
    const d = demoWorkspace(
      region.id === "ar" ? REGIONS[1].center : region.center,
    );
    replace({
      ...ws,
      features: [
        ...ws.features,
        ...d.features.filter((f) => !ws.features.some((x) => x.id === f.id)),
      ],
      meta: { ...ws.meta, ...d.meta },
    });
    mapRef.current?.flyTo(
      region.id === "ar" ? REGIONS[1].center : region.center,
      10.4,
    );
    toast.success("Demo cargado: zonas, rutas y sensores de ejemplo");
  }, [region, ws, replace, mapRef]);

  const setTool = useCallback(
    (t: string | null) => {
      setToolRaw(t);
      if (t) {
        setView("2d");
        setEditingRaw(false);
      } else setLive(null);
    },
    [setView],
  );
  const setEditing = useCallback(
    (v: boolean) => {
      setEditingRaw(v);
      if (v) {
        setView("2d");
        setToolRaw(null);
      }
    },
    [setView],
  );
  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    setEditingRaw(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) ||
          t.closest("[role=dialog]"))
      )
        return;
      setToolRaw(null);
      setEditingRaw(false);
      setSelectedId(null);
      setLive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return {
    tool,
    setToolRaw,
    setEditingRaw,
    selectedId,
    editing,
    live,
    setLive,
    addFeature,
    removeFeature,
    onEdited,
    loadDemo,
    setTool,
    setEditing,
    select,
  };
}
