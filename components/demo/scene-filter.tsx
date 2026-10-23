"use client";

import { useState } from "react";
import { Factory, Flame, RotateCcw } from "lucide-react";
import type { DemoTranslate } from "@/lib/admin/i18n-demo";
import { FIRE_POINTS, NOISE_POINTS } from "@/lib/demo/data";
import { ArgentinaMap, HeatDot, NoiseMark, at, type DemoGeo } from "./map";
import { Legend, SceneFrame } from "./scene-frame";

const SETTLE_AT = 1.6;

/** Scene 2: every dot starts as "heat"; the ones that are not a fire turn into dashed rings. */
export function SceneFilter({ t, geo }: { t: DemoTranslate; geo: DemoGeo }) {
  const [run, setRun] = useState(0);
  return (
    <SceneFrame
      t={t}
      n={2}
      title={t("s2.title")}
      body={t("s2.body")}
      extra={
        <>
          <p className="d-callout">{t("s2.criterion")}</p>
          <ul className="d-chips">
            <li>
              <Factory aria-hidden className="size-5" />
              {t("s2.chipIndustrial")}
            </li>
            <li>
              <Flame aria-hidden className="size-5" />
              {t("s2.chipFixed")}
            </li>
          </ul>
        </>
      }
    >
      <ArgentinaMap geo={geo} label={t("chrome.mapLabel")}>
        <g key={run}>
          {FIRE_POINTS.map((p, i) => {
            const [x, y] = at(geo, p.lon, p.lat);
            return <HeatDot key={`f${i}`} x={x} y={y} />;
          })}
          {NOISE_POINTS.map((p, i) => {
            const [x, y] = at(geo, p.lon, p.lat);
            return (
              <g key={`n${i}`}>
                <HeatDot
                  x={x}
                  y={y}
                  delay={SETTLE_AT + i * 0.25}
                  kind="noise-hot"
                />
                <NoiseMark x={x} y={y} delay={SETTLE_AT + i * 0.25} />
              </g>
            );
          })}
        </g>
      </ArgentinaMap>
      <Legend
        items={[
          { icon: "fire", label: t("s2.fire") },
          { icon: "ring", label: t("s2.noise") },
        ]}
      />
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
