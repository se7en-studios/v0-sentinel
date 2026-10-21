"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { OpacityKey } from "@/lib/admin/types";
import type { ShowLayers } from "./map-view";
import type { Ctx } from "./ctx";
import { Slider } from "./ui";

interface RowProps {
  label: string;
  thumb: string;
  checked: boolean;
  onCheck: (v: boolean) => void;
  slider?: {
    value: number;
    onChange: (v: number) => void;
    format?: (v: number) => string;
    min?: number;
    max?: number;
    step?: number;
  };
  disabled?: boolean;
  badge?: string;
}

/** One layer row: thumbnail, checkbox, name and an opacity slider, as in the reference layers list. */
function LayerRow({
  label,
  thumb,
  checked,
  onCheck,
  slider,
  disabled,
  badge,
}: RowProps) {
  return (
    <li
      className={cn(
        "group/row flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-foreground/[0.035]",
        disabled && "opacity-45",
      )}
    >
      <span
        className="relative size-6 shrink-0 overflow-hidden rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
        style={{ background: thumb }}
        aria-hidden
      />
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheck(e.target.checked)}
          className="size-3.5 shrink-0 cursor-pointer accent-[var(--primary)]"
        />
        <span
          className={cn(
            "truncate text-[12px] font-medium",
            !checked && "text-foreground/45",
          )}
        >
          {label}
        </span>
        {badge && (
          <span className="rounded bg-[#e8710a]/14 px-1 text-[8.5px] font-semibold uppercase tracking-wider text-[#b9560a]">
            {badge}
          </span>
        )}
      </label>
      {slider && (
        <Slider
          label={`Opacidad: ${label}`}
          value={slider.value}
          onChange={slider.onChange}
          format={slider.format}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          className="w-[86px] shrink-0 opacity-0 transition-opacity duration-150 group-focus-within/row:opacity-100 group-hover/row:opacity-100 [@media(hover:none)]:opacity-100"
        />
      )}
    </li>
  );
}

const T = {
  terrain: "linear-gradient(135deg,#8a7a5c 0%,#c9b98f 45%,#5f7a4e 100%)",
  imagery: "linear-gradient(135deg,#3c5a3a,#6d7f4f 50%,#a8946a)",
  hill: "linear-gradient(120deg,#f3efe4 0%,#8d8878 50%,#2c2a25 100%)",
  tint: "linear-gradient(90deg,#2c6a40,#9a9c58 40%,#c8b8a0 75%,#fff)",
  fires: "radial-gradient(circle at 50% 50%,#ffe29a,#ff6a1a 45%,#a81f0c 100%)",
  heat: "radial-gradient(circle,#fff0b8,#ff8a2a 50%,rgba(226,64,31,.2))",
  spread: "radial-gradient(ellipse at 30% 50%,#ff7a45,#ffb08a 55%,#f6e7de)",
  zones: "linear-gradient(135deg,rgba(15,122,79,.85),rgba(15,122,79,.35))",
  lines: "linear-gradient(135deg,#f3efe4 40%,#1b6fb8 41% 59%,#f3efe4 60%)",
  routes: "repeating-linear-gradient(135deg,#e8710a 0 5px,#f3efe4 5px 9px)",
  drones: "radial-gradient(circle,#fff 0 22%,#0f7a4f 24% 100%)",
  sensors:
    "radial-gradient(circle,#fff 0 20%,#0e9aa7 22% 55%,rgba(14,154,167,.25) 57%)",
  forest: "linear-gradient(180deg,#2f6b45,#16402a)",
  buildings: "linear-gradient(135deg,#e6e0d0 0 50%,#b9b09a 50%)",
  names: "linear-gradient(135deg,#f3efe4,#d9d3c3)",
};

export function LayersPanel({ ctx }: { ctx: Ctx }) {
  const { ws, show, setShow, setSettings } = ctx;
  const o = ws.settings.opacity;
  const lastOpacity = useRef<Partial<Record<OpacityKey, number>>>({});
  // off remembers the current value; on brings it back instead of the default
  const toggleOpacity = (k: OpacityKey, dflt: number) => (v: boolean) => {
    if (!v && o[k] > 0) lastOpacity.current[k] = o[k];
    setSettings({ opacity: { ...o, [k]: v ? (lastOpacity.current[k] ?? dflt) : 0 } });
  };
  const op = (k: OpacityKey) => ({
    value: o[k],
    onChange: (v: number) => setSettings({ opacity: { ...o, [k]: v } }),
  });
  const tog = (k: keyof ShowLayers) => (v: boolean) =>
    setShow({ ...show, [k]: v });
  const d3 = ctx.view === "3d";

  return (
    <div>
      <div className="px-4 pb-1 pt-3.5">
        <ul>
          {/* Relieve y base */}
          <LayerRow
            label="Terreno 3D"
            thumb={T.terrain}
            checked={d3}
            onCheck={(v) => ctx.setView(v ? "3d" : "2d")}
            slider={{
              value: ws.settings.exaggeration,
              onChange: (v) => setSettings({ exaggeration: v }),
              min: 1,
              max: 3.5,
              step: 0.1,
              format: (v) => `${v.toFixed(1)}×`,
            }}
          />
          <LayerRow
            label="Imagen satelital"
            thumb={T.imagery}
            checked={o.imagery > 0}
            onCheck={toggleOpacity("imagery", 1)}
            slider={op("imagery")}
          />
          <LayerRow
            label="Relieve sombreado"
            thumb={T.hill}
            checked={o.relief > 0}
            onCheck={toggleOpacity("relief", 0.6)}
            slider={op("relief")}
          />
          <LayerRow
            label="Hipsometría"
            thumb={T.tint}
            checked={o.tint > 0}
            onCheck={toggleOpacity("tint", 0.3)}
            slider={{ ...op("tint"), max: 0.8 }}
          />
          <LayerRow
            label="Bosque en volumen"
            thumb={T.forest}
            checked={show.forest}
            onCheck={tog("forest")}
            disabled={!d3}
          />
          <LayerRow
            label="Edificios 3D"
            thumb={T.buildings}
            checked={show.buildings}
            onCheck={tog("buildings")}
          />
        </ul>
        <h4 className="mb-0.5 mt-3 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-foreground/40">Detección</h4>
        <ul>
          <LayerRow
            label="Anomalías térmicas"
            thumb={T.fires}
            checked={show.fires}
            onCheck={tog("fires")}
            slider={op("fires")}
            badge="NASA"
          />
          <LayerRow
            label="Mapa de calor"
            thumb={T.heat}
            checked={show.heat}
            onCheck={tog("heat")}
          />
          <LayerRow
            label="Propagación prevista"
            thumb={T.spread}
            checked={show.spread}
            onCheck={tog("spread")}
            slider={op("spread")}
            badge="demo"
          />
        </ul>
        <h4 className="mb-0.5 mt-3 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-foreground/40">Operación</h4>
        <ul>
          <LayerRow
            label="Zonas monitoreadas"
            thumb={T.zones}
            checked={show.zones}
            onCheck={tog("zones")}
            slider={op("zones")}
          />
          <LayerRow
            label="Líneas y cortafuegos"
            thumb={T.lines}
            checked={show.lines}
            onCheck={tog("lines")}
          />
          <LayerRow
            label="Rutas de drones"
            thumb={T.routes}
            checked={show.routes}
            onCheck={tog("routes")}
            slider={op("routes")}
          />
          <LayerRow
            label="Drones"
            thumb={T.drones}
            checked={show.drones}
            onCheck={tog("drones")}
            badge="sim"
          />
          <LayerRow
            label="Sensores"
            thumb={T.sensors}
            checked={show.sensors}
            onCheck={tog("sensors")}
            badge="sim"
          />
        </ul>
        <h4 className="mb-0.5 mt-3 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-foreground/40">Mapa</h4>
        <ul>
          <LayerRow
            label="Nombres y cotas"
            thumb={T.names}
            checked={show.names}
            onCheck={tog("names")}
            slider={op("labels")}
          />
        </ul>
      </div>
    </div>
  );
}
