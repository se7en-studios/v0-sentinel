"use client";

import { cn } from "@/lib/utils";
import { BASES } from "@/lib/admin/map-config";
import type { BaseLayer, OpacityKey } from "@/lib/admin/types";
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
        "flex items-center gap-2.5 px-1 py-1.5",
        disabled && "opacity-45",
      )}
    >
      <span
        className="relative size-7 shrink-0 overflow-hidden rounded-[7px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
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
          className="w-[86px] shrink-0"
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
  const op = (k: OpacityKey) => ({
    value: o[k],
    onChange: (v: number) => setSettings({ opacity: { ...o, [k]: v } }),
  });
  const tog = (k: keyof ShowLayers) => (v: boolean) =>
    setShow({ ...show, [k]: v });
  const d3 = ctx.view === "3d";

  return (
    <div>
      <div className="px-4 pt-3.5">
        <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-foreground/50">
          Mapa base
        </h3>
        <div
          className="grid grid-cols-5 gap-1.5"
          role="radiogroup"
          aria-label="Mapa base"
        >
          {(Object.keys(BASES) as BaseLayer[]).map((id) => {
            const b = BASES[id];
            const on = ws.settings.baseLayer === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                title={`${b.label} · ${b.hint}`}
                onClick={() => setSettings({ baseLayer: id })}
                className={cn(
                  "group relative overflow-hidden rounded-lg border text-left transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on
                    ? "border-primary shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_25%,transparent)]"
                    : "border-[var(--hairline)] hover:border-foreground/30",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.thumb}
                  alt=""
                  loading="lazy"
                  width={64}
                  height={48}
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="block truncate bg-card px-1 py-0.5 text-center text-[9.5px] font-medium">
                  {b.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-1 pt-3.5">
        <h3 className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-foreground/50">
          Capas
        </h3>
        <ul>
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
            onCheck={(v) =>
              setSettings({ opacity: { ...o, imagery: v ? 1 : 0 } })
            }
            slider={op("imagery")}
          />
          <LayerRow
            label="Relieve sombreado"
            thumb={T.hill}
            checked={o.relief > 0}
            onCheck={(v) =>
              setSettings({ opacity: { ...o, relief: v ? 0.6 : 0 } })
            }
            slider={op("relief")}
          />
          <LayerRow
            label="Hipsometría"
            thumb={T.tint}
            checked={o.tint > 0}
            onCheck={(v) =>
              setSettings({ opacity: { ...o, tint: v ? 0.3 : 0 } })
            }
            slider={{ ...op("tint"), max: 0.8 }}
          />
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
