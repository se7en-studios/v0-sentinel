"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { parseWorkspace } from "@/lib/admin/store";
import { MAX_IMPORT_BYTES, parseGeoJson } from "@/lib/admin/geojson-io";
import { parseKml, toKml } from "@/lib/admin/kml";
import { Download, Trash2, Upload } from "lucide-react";
import {
  DEFAULT_SETTINGS,
    REGIONS,
  SENSOR_LABEL,
  type Confidence,
  type Workspace,
} from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { Badge, Btn, Card, Field, Toggle, inputCls } from "./ui";

export function SettingsView({ ctx }: { ctx: Ctx }) {
  const { ws, setSettings } = ctx;
  const s = ws.settings;
  const file = useRef<HTMLInputElement>(null);
  const th = s.thresholds;

  const saveFile = (body: string, mime: string, ext: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([body], { type: mime }));
    a.download = `sentinel-workspace-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };

  const exportJson = () =>
    saveFile(
      JSON.stringify({ type: "FeatureCollection", features: ws.features, meta: ws.meta, settings: s }, null, 2),
      "application/geo+json",
      "geojson",
    );

  const exportKml = () => saveFile(toKml(ws.features, ws.meta), "application/vnd.google-earth.kml+xml", "kml");

  const importFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_IMPORT_BYTES) return toast.error("El archivo supera los 2 MB.");
    try {
      const text = await f.text();
      const isKml = /\.kml$/i.test(f.name) || /^\s*(<\?xml|<kml)/i.test(text);
      let features: Workspace["features"];
      let names: Record<string, string>;
      let rawMeta: Record<string, unknown> = {};
      let settings: unknown = ws.settings;
      if (isKml) {
        features = parseKml(text);
        names = Object.fromEntries(features.map((x) => [x.id, String(x.properties.name || x.id)]));
      } else {
        const r = parseGeoJson(text);
        ({ features, names, meta: rawMeta } = r);
        if (r.settings && typeof r.settings === "object") settings = r.settings;
      }
      features = features.map(({ properties: { mode }, ...x }) => ({ ...x, properties: { mode } }));
      if (features.length === 0)
        return toast.error("No hay elementos compatibles. Se importan polígonos, líneas y puntos (los MultiPolígonos se separan solos).");
      if (!window.confirm(`Esto reemplaza tu espacio actual (${ws.features.length} elementos) por ${features.length} importados. ¿Continuar? Podés deshacer con Ctrl Z.`)) return;
      const meta = Object.fromEntries(
        features.map((x) => {
          const old = rawMeta[x.id];
          const base = old && typeof old === "object" ? (old as Record<string, unknown>) : {};
          return [x.id, { ...base, name: names[x.id] ?? x.id }];
        }),
      );
      // settings travel with the export; parseWorkspace validates them like any stored data
      ctx.replaceWorkspace(parseWorkspace({ ...ws, features, meta, settings }));
      toast.success(`${features.length} elementos importados`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    }
  };

  const num = (k: keyof typeof th) => (
    <input
      type="number"
      className={inputCls}
      value={th[k]}
      onChange={(e) =>
        Number.isFinite(e.target.valueAsNumber) &&
        setSettings({ thresholds: { ...th, [k]: e.target.valueAsNumber } })
      }
    />
  );

  return (
    <div className="view-in mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Configuración</h1>
        <p className="text-[13px] text-foreground/55">
          Se guarda automáticamente: en la nube si ingresaste con una
          cuenta, o en este navegador si no. Exportá el espacio de trabajo para
          compartirlo o respaldarlo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Organización y mapa">
          <div className="space-y-3">
            <Field label="Nombre de la organización">
              <input
                className={inputCls}
                value={s.org}
                onChange={(e) => setSettings({ org: e.target.value })}
              />
            </Field>
            <Field label="Región inicial">
              <select
                className={inputCls}
                value={s.regionId}
                onChange={(e) => setSettings({ regionId: e.target.value })}
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unidad de superficie">
              <select
                className={inputCls}
                value={s.units}
                onChange={(e) =>
                  setSettings({ units: e.target.value as "ha" | "km2" })
                }
              >
                <option value="ha">Hectáreas</option>
                <option value="km2">Kilómetros cuadrados</option>
              </select>
            </Field>
            <Field
              label={`Exageración del relieve 3D: ${s.exaggeration.toFixed(1)}×`}
            >
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={s.exaggeration}
                onChange={(e) =>
                  setSettings({ exaggeration: Number(e.target.value) })
                }
                className="w-full accent-primary"
              />
            </Field>
          </div>
        </Card>

        <Card title="Detección satelital">
          <div className="space-y-3">
            <Field
              label="Confianza mínima de focos"
              hint="Alta reduce falsos positivos; baja detecta más temprano."
            >
              <select
                className={inputCls}
                value={s.minConfidence}
                onChange={(e) =>
                  setSettings({ minConfidence: e.target.value as Confidence })
                }
              >
                <option value="l">Baja (todos los focos)</option>
                <option value="n">Nominal (recomendado)</option>
                <option value="h">Alta</option>
              </select>
            </Field>
            <Toggle
              checked={s.hideNoise}
              onChange={(v) => setSettings({ hideNoise: v })}
              label="Ocultar calor industrial"
              hint="Descarta píxeles fijos de baja potencia (más de 5 días seguidos) y los de plantas y yacimientos conocidos. Los sitios están marcados con coordenadas aproximadas."
            />
            <Field
              label={`Radio de alerta alrededor de cada zona: ${s.bufferKm} km`}
            >
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={s.bufferKm}
                onChange={(e) =>
                  setSettings({ bufferKm: Number(e.target.value) })
                }
                className="w-full accent-primary"
              />
            </Field>
            <Field label="Valor por hectárea (USD)" hint="Opcional. Habilita la estimación de valor expuesto en Métricas y en el reporte.">
              <input type="number" min={0} className={inputCls} value={s.valuePerHa} onChange={(e) => setSettings({ valuePerHa: Math.max(0, Number(e.target.value)) })} />
            </Field>
            <Field
              label="Actualizar datos cada (minutos)"
              hint="NASA publica nuevas pasadas cada pocas horas."
            >
              <select
                className={inputCls}
                value={s.refreshMin}
                onChange={(e) =>
                  setSettings({ refreshMin: Number(e.target.value) })
                }
              >
                {[10, 30, 60].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>
      </div>

      <Card
        title="Umbrales de sensores"
        right={<Badge tone="sim">simulado</Badge>}
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label={`Temperatura ≥ (${SENSOR_LABEL.temp.unit})`}>
            {num("temp")}
          </Field>
          <Field label="Humedad ≤ (%)">{num("humidity")}</Field>
          <Field label="Humo / CO ≥ (ppm)">{num("smoke")}</Field>
          <Field label="Viento ≥ (km/h)">{num("wind")}</Field>
        </div>
      </Card>

      <Card title="Notificaciones" right={<Badge>Próximamente: envío</Badge>}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Email de alertas">
            <input
              type="email"
              className={inputCls}
              value={s.notify.email}
              placeholder="equipo@empresa.com"
              onChange={(e) =>
                setSettings({ notify: { ...s.notify, email: e.target.value } })
              }
            />
          </Field>
          <Field label="WhatsApp de guardia">
            <input
              type="tel"
              className={inputCls}
              value={s.notify.whatsapp}
              placeholder="+54 9 11 ..."
              onChange={(e) =>
                setSettings({
                  notify: { ...s.notify, whatsapp: e.target.value },
                })
              }
            />
          </Field>
        </div>
        <div className="mt-2">
          <Toggle
            checked={s.notify.onZoneHit}
            onChange={(v) =>
              setSettings({ notify: { ...s.notify, onZoneHit: v } })
            }
            label="Avisar cuando entra un foco a una zona (con el panel abierto)"
          />
          <Toggle
            checked={s.notify.onSensor}
            onChange={(v) =>
              setSettings({ notify: { ...s.notify, onSensor: v } })
            }
            label="Avisar cuando un sensor supera su umbral (simulado, con el panel abierto)"
          />
          <Toggle
            checked={s.notify.browser}
            onChange={async (v) => {
              if (v && typeof Notification !== "undefined" && Notification.permission !== "granted") {
                const r = await Notification.requestPermission();
                if (r !== "granted") return toast.error("El navegador bloqueó las notificaciones");
              }
              setSettings({ notify: { ...s.notify, browser: v } });
            }}
            label="Notificaciones del navegador (con el panel abierto)"
          />
        </div>
        <p className="mt-1 text-[11px] text-foreground/45">
          Los contactos quedan guardados; el envío automático se activa al
          conectar el servicio de mensajería.
        </p>
      </Card>

      <Card title="Datos">
        <div className="flex flex-wrap gap-2">
          <Btn onClick={exportJson}>
            <Download className="size-3.5" /> Exportar GeoJSON
          </Btn>
          <Btn onClick={exportKml}>
            <Download className="size-3.5" /> Exportar KML
          </Btn>
          <Btn onClick={() => file.current?.click()}>
            <Upload className="size-3.5" /> Importar (GeoJSON / KML)
          </Btn>
          <input
            ref={file}
            type="file"
            accept=".geojson,.json,.kml,application/json,application/vnd.google-earth.kml+xml"
            hidden
            onChange={(e) => {
              importFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Btn
            variant="danger"
            onClick={() =>
              window.confirm("¿Borrar todas las zonas, rutas y sensores?") &&
              ctx.replaceWorkspace({ ...ws, features: [], meta: {} })
            }
          >
            <Trash2 className="size-3.5" /> Vaciar espacio de trabajo
          </Btn>
          <Btn
            onClick={() => {
              if (
                !window.confirm(
                  "¿Restablecer capas, umbrales, unidades y opacidades? Se conservan tu organización, tus contactos y tus reglas de alerta.",
                )
              )
                return;
              setSettings({
                ...DEFAULT_SETTINGS,
                org: s.org,
                notify: s.notify,
                rules: s.rules,
              });
            }}
          >
            Restablecer ajustes
          </Btn>
        </div>
      </Card>

      <Card title="Fuentes de datos">
        <ul className="space-y-1 text-[12.5px] text-foreground/70">
          <li>
            <b>Focos de calor:</b> NASA FIRMS, VIIRS NOAA-20 + NOAA-21 (375 m),
            casi tiempo real.
          </li>
          <li>
            <b>Imágenes:</b> Esri World Imagery · Sentinel-2 cloudless
            (Copernicus, EOX) · NASA GIBS VIIRS.
          </li>
          <li>
            <b>Relieve 3D:</b> Mapzen/AWS Terrain Tiles. <b>Clima:</b>{" "}
            Open-Meteo.
          </li>
          <li>
            <b>Drones y sensores:</b> simulados hasta conectar hardware real.
          </li>
        </ul>
      </Card>
    </div>
  );
}
