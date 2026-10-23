"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { DemoTranslate } from "@/lib/admin/i18n-demo";
import { FIRE_POINTS, NOISE_POINTS } from "@/lib/demo/data";
import { ArgentinaMap, HeatDot, at, type DemoGeo } from "./map";
import { Legend, SceneFrame } from "./scene-frame";

const SCAN_SECONDS = 2.6;

/** Scene 1: a satellite pass sweeps the country top to bottom and heat dots appear as it goes. */
export function SceneHeat({ t, geo }: { t: DemoTranslate; geo: DemoGeo }) {
  const [run, setRun] = useState(0);
  const dots = [...FIRE_POINTS, ...NOISE_POINTS].map((p) => {
    const [x, y] = at(geo, p.lon, p.lat);
    return { x, y, delay: 0.3 + (y / geo.proj.h) * (SCAN_SECONDS - 0.4) };
  });
  return (
    <SceneFrame
      t={t}
      n={1}
      title={t("s1.title")}
      body={t("s1.body")}
      extra={
        <>
          <p className="d-aside">{t("s1.note")}</p>
        </>
      }
    >
      <ArgentinaMap geo={geo} label={t("chrome.mapLabel")}>
        <g key={run}>
          <rect
            x="0"
            y="-30"
            width={geo.proj.w}
            height="30"
            className="d-scan"
            style={{ "--h": `${geo.proj.h + 30}px` } as React.CSSProperties}
          />
          {dots.map((d, i) => (
            <HeatDot key={i} {...d} />
          ))}
        </g>
      </ArgentinaMap>
      <Legend items={[{ icon: "fire", label: t("s1.legend") }]} />
          <button
            type="button"
            className="d-btn d-btn--ghost"
            onClick={() => setRun((r) => r + 1)}
          >
            <RotateCcw aria-hidden className="size-5" />
            {t("chrome.replay")}
          </button>
    </SceneFrame>
  );
}
