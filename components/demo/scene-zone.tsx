"use client";

import { useState } from "react";
import { BellRing, PenTool, RotateCcw } from "lucide-react";
import type { DemoTranslate } from "@/lib/admin/i18n-demo";
import { ZONE_PRESET, ZONE_SHAPE } from "@/lib/demo/data";
import { inside } from "@/lib/demo/geo";
import { ArgentinaMap, at, delayStyle, type DemoGeo } from "./map";
import { SceneFrame } from "./scene-frame";

const ZONE_RADIUS = 18;

interface Picked {
  lon: number;
  lat: number;
}

function Phone({ t, alert }: { t: DemoTranslate; alert: boolean }) {
  return (
    <div className="d-phone" role="img" aria-label={t("s4.phone")}>
      <div className="d-phone-notch" aria-hidden />
      <div className="d-phone-screen">
        {alert ? (
          <div className="d-notif" role="status" style={delayStyle(1.4)}>
            <div className="d-notif-head">
              <span className="d-notif-icon" aria-hidden>
                <BellRing className="size-4" />
              </span>
              <span>{t("s4.notifApp")}</span>
              <span className="d-notif-when">{t("s4.notifWhen")}</span>
            </div>
            <p className="d-notif-title">
              {t("s4.notifTitle", { zone: t("s4.zoneName") })}
            </p>
            <p className="d-notif-body">{t("s4.notifBody")}</p>
          </div>
        ) : (
          <p className="d-phone-idle">{t("s4.idle")}</p>
        )}
      </div>
    </div>
  );
}

/** Scene 4: the visitor drops a zone (button or click on the map) and a mock phone alert appears. */
export function SceneZone({
  t,
  geo,
  rings,
}: {
  t: DemoTranslate;
  geo: DemoGeo;
  rings: readonly (readonly (readonly number[])[])[];
}) {
  const [zone, setZone] = useState<Picked | null>(null);
  const [run, setRun] = useState(0);
  const place = (p: Picked) => {
    setZone(p);
    setRun((r) => r + 1);
  };
  const pick = (lon: number, lat: number) => {
    if (inside(rings, lon, lat)) place({ lon, lat });
  };
  const [zx, zy] = zone ? at(geo, zone.lon, zone.lat) : [0, 0];
  const outline = ZONE_SHAPE.map(
    ([dx, dy]) =>
      `${(zx + dx * ZONE_RADIUS).toFixed(1)},${(zy + dy * ZONE_RADIUS).toFixed(1)}`,
  ).join(" ");
  return (
    <SceneFrame
      t={t}
      n={4}
      title={t("s4.title")}
      body={t("s4.body")}
      extra={
        <>
          <div className="d-actions">
            <button
              type="button"
              className="d-btn"
              onClick={() => place(ZONE_PRESET)}
            >
              {zone ? (
                <RotateCcw aria-hidden className="size-5" />
              ) : (
                <PenTool aria-hidden className="size-5" />
              )}
              {zone ? t("s4.again") : t("s4.draw")}
            </button>
          </div>
          <p className="d-aside">{t("s4.orTap")}</p>
          <p className="d-aside" role="status">
            {zone ? t("s4.zoneDrawn") : ""}
          </p>
          <p className="d-aside">{t("s4.mock")}</p>
        </>
      }
    >
      <div className="d-s4">
        <ArgentinaMap
          geo={geo}
          label={t("chrome.mapLabel")}
          small
          onPick={pick}
        >
          {zone && (
            <g key={run}>
              <polygon points={outline} className="d-zone" pathLength={1} />
              <g
                transform={`translate(${(zx + 3).toFixed(1)} ${(zy - 2).toFixed(1)})`}
              >
                <circle r="8" className="d-halo" style={delayStyle(1.1)} />
                <circle r="3.6" className="d-dot d-pop" style={delayStyle(1)} />
              </g>
            </g>
          )}
        </ArgentinaMap>
        <Phone t={t} alert={zone !== null} key={run} />
      </div>
    </SceneFrame>
  );
}
