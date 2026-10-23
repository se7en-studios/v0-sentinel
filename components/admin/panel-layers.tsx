"use client";

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpacityKey } from "@/lib/admin/types";
import type { ShowLayers } from "./map-view";
import type { MsgKey } from "@/lib/admin/i18n";
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
  opacityLabel: (label: string) => string;
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
  opacityLabel,
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
          label={opacityLabel(label)}
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
  early:
    "radial-gradient(circle,#0b1f26 0 28%,#22d3ee 30% 46%,rgba(34,211,238,.25) 48%)",
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

type Row = Omit<RowProps, "slider" | "opacityLabel"> & {
  slider?: RowProps["slider"];
  key: string;
};
type Section = { title?: MsgKey; rows: Row[] };

const norm = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function LayersPanel({ ctx }: { ctx: Ctx }) {
  const { ws, show, setShow, setSettings, t } = ctx;
  const o = ws.settings.opacity;
  const [q, setQ] = useState("");
  const lastOpacity = useRef<Partial<Record<OpacityKey, number>>>({});
  // off remembers the current value; on brings it back instead of the default
  const toggleOpacity = (k: OpacityKey, dflt: number) => (v: boolean) => {
    if (!v && o[k] > 0) lastOpacity.current[k] = o[k];
    setSettings({
      opacity: { ...o, [k]: v ? (lastOpacity.current[k] ?? dflt) : 0 },
    });
  };
  const op = (k: OpacityKey) => ({
    value: o[k],
    onChange: (v: number) => setSettings({ opacity: { ...o, [k]: v } }),
  });
  const tog = (k: keyof ShowLayers) => (v: boolean) =>
    setShow({ ...show, [k]: v });
  const d3 = ctx.view === "3d";
  const r = (
    key: string,
    label: MsgKey,
    thumb: string,
    checked: boolean,
    onCheck: (v: boolean) => void,
    extra: Partial<Row> = {},
  ): Row => ({ key, label: t(label), thumb, checked, onCheck, ...extra });

  const sections: Section[] = [
    {
      rows: [
        r(
          "t3d",
          "lay.t3d",
          T.terrain,
          d3,
          (v) => ctx.setView(v ? "3d" : "2d"),
          {
            slider: {
              value: ws.settings.exaggeration,
              onChange: (v) => setSettings({ exaggeration: v }),
              min: 1,
              max: 3.5,
              step: 0.1,
              format: (v) => `${v.toFixed(1)}×`,
            },
          },
        ),
        r(
          "img",
          "lay.img",
          T.imagery,
          o.imagery > 0,
          toggleOpacity("imagery", 1),
          { slider: op("imagery") },
        ),
        r(
          "rel",
          "lay.rel",
          T.hill,
          o.relief > 0,
          toggleOpacity("relief", 0.6),
          { slider: op("relief") },
        ),
        r(
          "tint",
          "lay.tint",
          T.tint,
          o.tint > 0,
          toggleOpacity("tint", 0.3),
          { slider: { ...op("tint"), max: 0.8 } },
        ),
        r("forest", "lay.forest", T.forest, show.forest, tog("forest"), {
          disabled: !d3,
        }),
        r("bld", "lay.bld", T.buildings, show.buildings, tog("buildings")),
      ],
    },
    {
      title: "lay.s.detect",
      rows: [
        r("fires", "lay.fires", T.fires, show.fires, tog("fires"), {
          slider: op("fires"),
          badge: "NASA",
        }),
        r("early", "lay.early", T.early, show.early, tog("early"), {
          badge: "GOES",
        }),
        r("heat", "lay.heat", T.heat, show.heat, tog("heat")),
        r(
          "spread",
          "lay.spread",
          T.spread,
          show.spread,
          tog("spread"),
          { slider: op("spread"), badge: "demo" },
        ),
      ],
    },
    {
      title: "lay.s.ops",
      rows: [
        r("zones", "lay.zones", T.zones, show.zones, tog("zones"), {
          slider: op("zones"),
        }),
        r("lines", "lay.lines", T.lines, show.lines, tog("lines")),
        r("routes", "lay.routes", T.routes, show.routes, tog("routes"), {
          slider: op("routes"),
        }),
        r("drones", "lay.drones", T.drones, show.drones, tog("drones"), {
          badge: t("lay.b.sim"),
        }),
        r("sensors", "lay.sensors", T.sensors, show.sensors, tog("sensors"), {
          badge: t("lay.b.sim"),
        }),
      ],
    },
    {
      title: "lay.s.map",
      rows: [
        r("names", "lay.names", T.names, show.names, tog("names"), {
          slider: op("labels"),
        }),
      ],
    },
  ];
  const needle = norm(q.trim());
  const visible = sections
    .map((sec) => ({
      ...sec,
      rows: sec.rows.filter((x) => !needle || norm(x.label).includes(needle)),
    }))
    .filter((sec) => sec.rows.length > 0);

  return (
    <div>
      <div className="px-4 pb-1 pt-3.5">
        <label className="relative mb-2 block">
          <span className="sr-only">{t("lay.search")}</span>
          <Search
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-foreground/40"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQ("")}
            placeholder={t("lay.searchPh")}
            className="h-8 w-full rounded-lg border border-[var(--hairline)] bg-transparent pl-7 pr-7 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {q && (
            <button
              type="button"
              aria-label={t("lay.clear")}
              onClick={() => setQ("")}
              className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-foreground/50 hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </label>
        {visible.length === 0 && (
          <p
            className="py-3 text-center text-[11.5px] text-foreground/50"
            role="status"
          >
            {t("lay.none", { q: q.trim() })}
          </p>
        )}
        {visible.map((sec, idx) => (
          <section key={sec.title ?? "base"}>
            {sec.title && (
              <h4
                className={cn(
                  "mb-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-foreground/40",
                  idx > 0 && "mt-3",
                )}
              >
                {t(sec.title)}
              </h4>
            )}
            <ul>
              {sec.rows.map(({ key, ...row }) => (
                <LayerRow
                  key={key}
                  {...row}
                  opacityLabel={(l) => t("lay.opacity", { label: l })}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
