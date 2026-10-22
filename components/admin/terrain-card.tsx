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
  const { terrainAt } = ctx;
  const [state, setState] = useState<State>({ s: "loading" });
  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset while the next lookup runs
    setState({ s: "loading" });
    terrainAt(lat, lng).then((t) => {
      if (live) setState(t ? { s: "ok", t } : { s: "error" });
    });
    return () => {
      live = false;
    };
  }, [terrainAt, lat, lng]);

  const line = state.s === "ok" ? terrainLine(state.t) : "";
  return (
    <Card
      title="Terreno y combustible"
      right={<Badge tone="muted">ESA · Copernicus</Badge>}
    >
      {state.s === "loading" && (
        <p className="text-[12px] text-foreground/55">
          Consultando el terreno…
        </p>
      )}
      {state.s === "error" && (
        <p className="text-[12px] text-foreground/55">
          No se pudo consultar el terreno ahora.
        </p>
      )}
      {state.s === "ok" && (
        <>
          <p className="text-[13px] font-medium">
            {line || "Sin datos de terreno en este punto."}
          </p>
          {state.t.burnable === false && (
            <p className="mt-1 text-[11.5px] text-[var(--state-warn-ink,inherit)]">
              La cobertura no es vegetal: puede ser calor urbano o industrial en
              vez de un incendio.
            </p>
          )}
          {state.t.slopeDeg !== null && state.t.slopeDeg >= 15 && (
            <p className="mt-1 text-[11.5px] text-foreground/65">
              Pendiente fuerte: el fuego sube mucho más rápido cuesta arriba.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
