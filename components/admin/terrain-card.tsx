"use client";

import { useEffect, useState } from "react";
import { terrainLine, type TerrainInfo } from "@/lib/admin/terrain";
import type { Ctx } from "./ctx";
import { Badge, Card } from "./ui";

type State = { s: "loading" } | { s: "error" } | { s: "ok"; t: TerrainInfo };

/** Fuel, elevation and slope under the incident's centre: what decides how it will behave. */
export function TerrainCard({
  ctx,
  lat,
  lng,
}: {
  ctx: Ctx;
  lat: number;
  lng: number;
}) {
  const { terrainAt, t } = ctx;
  const [state, setState] = useState<State>({ s: "loading" });
  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset while the next lookup runs
    setState({ s: "loading" });
    terrainAt(lat, lng).then((info) => {
      if (live) setState(info ? { s: "ok", t: info } : { s: "error" });
    });
    return () => {
      live = false;
    };
  }, [terrainAt, lat, lng]);

  const line = state.s === "ok" ? terrainLine(state.t, ctx.ws.settings.locale) : "";
  return (
    <Card
      title={t("terr.title")}
      right={<Badge tone="muted">ESA · Copernicus</Badge>}
    >
      {state.s === "loading" && (
        <p className="text-[12px] text-foreground/55">
          {t("terr.loading")}
        </p>
      )}
      {state.s === "error" && (
        <p className="text-[12px] text-foreground/55">
          {t("terr.error")}
        </p>
      )}
      {state.s === "ok" && (
        <>
          <p className="text-[13px] font-medium">
            {line || t("terr.none")}
          </p>
          {state.t.burnable === false && (
            <p className="mt-1 text-[11.5px] text-[var(--state-warn-ink,inherit)]">
              {t("terr.nonveg")}
            </p>
          )}
          {state.t.slopeDeg !== null && state.t.slopeDeg >= 15 && (
            <p className="mt-1 text-[11.5px] text-foreground/65">
              {t("terr.steep")}
            </p>
          )}
        </>
      )}
    </Card>
  );
}
