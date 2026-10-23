"use client";

import { useState } from "react";
import type { DemoKey, DemoTranslate } from "@/lib/admin/i18n-demo";
import { EARLY_POINT } from "@/lib/demo/data";
import { ArgentinaMap, at, delayStyle, type DemoGeo } from "./map";
import { SceneFrame } from "./scene-frame";

const GOES_TICKS = 24;
const CONF: { id: "low" | "mid" | "high"; label: DemoKey; text: DemoKey }[] = [
  { id: "low", label: "s3.confLow", text: "s3.confLowText" },
  { id: "mid", label: "s3.confMid", text: "s3.confMidText" },
  { id: "high", label: "s3.confHigh", text: "s3.confHighText" },
];
// Positions (%) on an illustrative timeline: no real durations are implied.
const EVENTS: { left: number; key: DemoKey; cls: string }[] = [
  { left: 30, key: "s3.ev1", cls: "d-ev--fire" },
  { left: 52, key: "s3.ev2", cls: "d-ev--alert" },
  { left: 82, key: "s3.ev3", cls: "d-ev--polar" },
];

function Timeline({ t }: { t: DemoTranslate }) {
  return (
    <div className="d-card">
      <div role="img" aria-label={t("s3.timeline")} className="d-tl">
        <p className="d-tl-lane">{t("s3.laneGoes")}</p>
        <div className="d-tl-ticks" aria-hidden>
          {Array.from({ length: GOES_TICKS }, (_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="d-tl-marks" aria-hidden>
        {EVENTS.map((e, i) => (
          <span
            key={e.key}
            className={`d-ev ${e.cls}`}
            style={{ left: `${e.left}%`, ...delayStyle(0.4 + i * 0.9) }}
            aria-hidden
          >
            {i + 1}
          </span>
        ))}
        </div>
        <p className="d-tl-lane">{t("s3.lanePolar")}</p>
        <div className="d-tl-polar" aria-hidden>
          <span style={{ left: "4%", width: "18%" }} />
          <span style={{ left: "72%", width: "20%" }} />
        </div>
      </div>
      <ol className="d-tl-list">
        {EVENTS.map((e, i) => (
          <li key={e.key}>
            <span className={`d-ev-badge ${e.cls}`} aria-hidden>
              {i + 1}
            </span>
            {t(e.key)}
          </li>
        ))}
      </ol>
      <p className="d-aside">{t("s3.scale")}</p>
    </div>
  );
}

function Confidence({ t }: { t: DemoTranslate }) {
  const [level, setLevel] = useState<(typeof CONF)[number]["id"]>("mid");
  const cur = CONF.find((c) => c.id === level)!;
  return (
    <div className="d-card">
      <h2 className="d-h2" id="d-conf">
        {t("s3.confTitle")}
      </h2>
      <div role="group" aria-labelledby="d-conf" className="d-seg">
        {CONF.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={level === c.id}
            onClick={() => setLevel(c.id)}
            className="d-seg-btn"
          >
            <span className={`d-bars d-bars--${c.id}`} aria-hidden>
              <i />
              <i />
              <i />
            </span>
            {t(c.label)}
          </button>
        ))}
      </div>
      <p className="d-conf-text" role="status">
        {t(cur.text)}
      </p>
    </div>
  );
}

/** Scene 3: early alert (cyan ring) ahead of the polar pass, shown as an untimed illustration. */
export function SceneEarly({ t, geo }: { t: DemoTranslate; geo: DemoGeo }) {
  const [x, y] = at(geo, EARLY_POINT.lon, EARLY_POINT.lat);
  return (
    <SceneFrame
      t={t}
      n={3}
      title={t("s3.title")}
      body={t("s3.body")}
      extra={<p className="d-body">{t("s3.body2")}</p>}
    >
      <div className="d-s3">
        <ArgentinaMap geo={geo} label={t("chrome.mapLabel")} small>
          <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            <circle
              r="14"
              className="d-alert-ring d-alert-pulse"
              style={delayStyle(1.2)}
            />
            <circle r="3.6" className="d-dot" />
          </g>
        </ArgentinaMap>
        <div className="d-stack">
          <Timeline t={t} />
          <Confidence t={t} />
        </div>
      </div>
    </SceneFrame>
  );
}
