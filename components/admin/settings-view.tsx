"use client";

import { useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { LOCALES, parseLocale } from "@/lib/admin/i18n";
import { essentialTabsText } from "@/lib/admin/goals";
import { NUM_LOCALE } from "@/lib/admin/i18n-shell";
import { parseWorkspace } from "@/lib/admin/store";
import { buildBackup, MAX_BACKUP_BYTES, readBackup } from "@/lib/admin/backup";
import { MAX_IMPORT_BYTES, parseGeoJson } from "@/lib/admin/geojson-io";
import { parseKml, toKml } from "@/lib/admin/kml";
import { Database, Download, ExternalLink, Trash2, Upload } from "lucide-react";
import {
  DEFAULT_SETTINGS,
  REGIONS,
  SENSOR_LABEL,
  type Confidence,
  type Workspace,
} from "@/lib/admin/types";
import type { Ctx } from "./ctx";
import { IntegrationsCard } from "./integrations-card";
import { Badge, Btn, Card, Field, Toggle, inputCls } from "./ui";
import { scrollToSources } from "./scroll-to-sources";

const SECTIONS = [
  { id: "set-general", key: "set.g.general" },
  { id: "set-detection", key: "set.g.detection" },
  { id: "set-alerts", key: "set.g.alerts" },
  { id: "set-integrations", key: "int.title" },
  { id: "set-data", key: "set.g.data" },
  { id: "set-sources", key: "set.g.sources" },
] as const;

/** [min, max] accepted for each sensor threshold */
const THRESHOLD_LIMITS: Record<"temp" | "humidity" | "smoke" | "wind", [number, number]> = {
  temp: [-50, 150],
  humidity: [0, 100],
  smoke: [0, 10_000],
  wind: [0, 300],
};

function saveFile(body: string, mime: string, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: mime }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

const stamp = () => new Date().toISOString().slice(0, 10);

/** A titled block of related cards; the heading gives screen readers and the jump bar something to land on. */
function Group({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-4 space-y-4">
      <h2
        id={`${id}-h`}
        className="border-b border-[var(--hairline)] pb-1.5 font-heading text-[15px] font-bold tracking-tight"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SettingsView({ ctx }: { ctx: Ctx }) {
  const { ws, setSettings, t } = ctx;
  const s = ws.settings;
  const mapFile = useRef<HTMLInputElement>(null);
  const backupFile = useRef<HTMLInputElement>(null);
  const th = s.thresholds;

  const exportJson = () =>
    saveFile(
      JSON.stringify({ type: "FeatureCollection", features: ws.features, meta: ws.meta, settings: s }, null, 2),
      "application/geo+json",
      `sentinel-workspace-${stamp()}.geojson`,
    );

  const exportKml = () =>
    saveFile(toKml(ws.features, ws.meta), "application/vnd.google-earth.kml+xml", `sentinel-workspace-${stamp()}.kml`);

  const downloadBackup = () =>
    saveFile(buildBackup(ws), "application/json", `sentinel-respaldo-${stamp()}.json`);

  const importBackup = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_BACKUP_BYTES)
      return toast.error(t("set.backup.big", { mb: MAX_BACKUP_BYTES / 1_000_000 }));
    let next: Workspace;
    try {
      next = readBackup(await f.text());
    } catch {
      return toast.error(t("set.backup.bad"));
    }
    if (!window.confirm(t("set.backup.confirm", { a: ws.features.length, b: next.features.length }))) return;
    ctx.replaceWorkspace(next);
    toast.success(t("set.backup.ok"));
  };

  const importFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > MAX_IMPORT_BYTES) return toast.error(t("set.err.size"));
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
      if (features.length === 0) return toast.error(t("set.err.empty"));
      if (!window.confirm(t("set.confirm.replace", { a: ws.features.length, b: features.length }))) return;
      const meta = Object.fromEntries(
        features.map((x) => {
          const old = rawMeta[x.id];
          const base = old && typeof old === "object" ? (old as Record<string, unknown>) : {};
          return [x.id, { ...base, name: names[x.id] ?? x.id }];
        }),
      );
      // settings travel with the export; parseWorkspace validates them like any stored data
      ctx.replaceWorkspace(parseWorkspace({ ...ws, features, meta, settings }));
      toast.success(t("set.imported", { n: features.length }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("set.err.read"));
    }
  };

  const jump = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  /** The sources card lives in Metrics: go there, scroll to it and open the licenses. */
  const openSources = () => {
    ctx.goTab("metricas");
    scrollToSources();
  };

  // uncontrolled so the field can be cleared and retyped; the value is clamped and saved on blur
  const num = (k: keyof typeof th) => {
    const [min, max] = THRESHOLD_LIMITS[k];
    return (
      <input
        key={th[k]}
        type="number"
        min={min}
        max={max}
        className={inputCls}
        defaultValue={th[k]}
        onBlur={(e) => {
          const n = e.target.valueAsNumber;
          if (!Number.isFinite(n)) {
            e.target.value = String(th[k]);
            return;
          }
          setSettings({ thresholds: { ...th, [k]: Math.min(max, Math.max(min, n)) } });
        }}
      />
    );
  };

  return (
    <div className="view-in mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">{t("tab.config")}</h1>
        <p className="text-[13px] text-foreground/65">{t("set.intro")}</p>
        <nav aria-label={t("set.nav")} className="mt-3 flex flex-wrap gap-1.5">
          {SECTIONS.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => jump(x.id)}
              className="min-h-8 rounded-full border border-[var(--hairline)] bg-card px-3 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t(x.key)}
            </button>
          ))}
        </nav>
      </div>

      <Group id="set-general" title={t("set.g.general")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card title={t("set.orgMap")}>
            <div className="space-y-3">
              <Field label={t("set.org")}>
                <input
                  className={inputCls}
                  value={s.org}
                  onChange={(e) => setSettings({ org: e.target.value })}
                />
              </Field>
              <Field label={t("set.region0")}>
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
              <Field label={t("set.units")}>
                <select
                  className={inputCls}
                  value={s.units}
                  onChange={(e) => setSettings({ units: e.target.value as "ha" | "km2" })}
                >
                  <option value="ha">{t("set.unit.ha")}</option>
                  <option value="km2">{t("set.unit.km2")}</option>
                </select>
              </Field>
              <Field label={t("set.exag", { v: s.exaggeration.toFixed(1) })}>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={s.exaggeration}
                  onChange={(e) => setSettings({ exaggeration: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </Field>
            </div>
          </Card>

          <Card title={t("set.langCard")}>
            <Field label={t("settings.language")} hint={t("settings.languageHint")}>
              <select
                className={inputCls}
                value={s.locale}
                onChange={(e) => setSettings({ locale: parseLocale(e.target.value) })}
              >
                {LOCALES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Field>
          </Card>

          <Card title={t("goal.settings.title")}>
            <p className="text-[13px] font-medium">{s.goal ? t(`goal.${s.goal}`) : t("goal.settings.none")}</p>
            <p className="mt-1 text-[11.5px] leading-snug text-foreground/60">{t("goal.settings.hint")}</p>
            <Btn className="mt-2 max-md:min-h-11" onClick={() => setSettings({ onboarded: false })}>
              {t("goal.settings.change")}
            </Btn>
            <div className="mt-3 border-t border-[var(--hairline)] pt-2">
              <Toggle
                checked={s.simpleMode}
                onChange={(v) => setSettings({ simpleMode: v })}
                label={t("simple.title")}
                hint={t("simple.hint", { tabs: essentialTabsText(t, NUM_LOCALE[s.locale]) })}
              />
            </div>
          </Card>
        </div>
      </Group>

      <Group id="set-detection" title={t("set.g.detection")}>
        <Card title={t("set.detection")}>
          <div className="space-y-3">
            <Field label={t("set.minConf")} hint={t("set.minConf.hint")}>
              <select
                className={inputCls}
                value={s.minConfidence}
                onChange={(e) => setSettings({ minConfidence: e.target.value as Confidence })}
              >
                <option value="l">{t("set.conf.l")}</option>
                <option value="n">{t("set.conf.n")}</option>
                <option value="h">{t("set.conf.h")}</option>
              </select>
            </Field>
            <Toggle
              checked={s.earlyAlerts}
              onChange={(v) => setSettings({ earlyAlerts: v })}
              label={t("set.early")}
              hint={t("set.early.hint")}
            />
            <Toggle
              checked={s.useModis}
              onChange={(v) => setSettings({ useModis: v })}
              label={t("set.modis")}
              hint={t("set.modis.hint")}
            />
            <Toggle
              checked={s.hideNoise}
              onChange={(v) => setSettings({ hideNoise: v })}
              label={t("set.noise")}
              hint={t("set.noise.hint")}
            />
            <Field
              label={t("set.score", { v: s.minScore === 0 ? t("set.score.none") : s.minScore })}
              hint={t("set.score.hint")}
            >
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={s.minScore}
                onChange={(e) => setSettings({ minScore: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </Field>
            <Field label={t("set.buffer", { km: s.bufferKm })}>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={s.bufferKm}
                onChange={(e) => setSettings({ bufferKm: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </Field>
            <Field label={t("set.value")} hint={t("set.value.hint")}>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={s.valuePerHa}
                onChange={(e) => setSettings({ valuePerHa: Math.max(0, Number(e.target.value)) })}
              />
            </Field>
            <Field label={t("set.refresh")} hint={t("set.refresh.hint")}>
              <select
                className={inputCls}
                value={s.refreshMin}
                onChange={(e) => setSettings({ refreshMin: Number(e.target.value) })}
              >
                {[10, 30, 60].map((m) => (
                  <option key={m} value={m}>
                    {t("set.minutes", { m })}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>
      </Group>

      <Group id="set-alerts" title={t("set.g.alerts")}>
        <Card title={t("set.sensors")} right={<Badge tone="sim">{t("set.simulated")}</Badge>}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field label={t("set.th.temp", { unit: SENSOR_LABEL.temp.unit })}>{num("temp")}</Field>
            <Field label={t("set.th.hum")}>{num("humidity")}</Field>
            <Field label={t("set.th.smoke")}>{num("smoke")}</Field>
            <Field label={t("set.th.wind")}>{num("wind")}</Field>
          </div>
        </Card>

        <Card title={t("set.notify")} right={<Badge>{t("set.notify.soon")}</Badge>}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t("set.notify.email")}>
              <input
                type="email"
                className={inputCls}
                value={s.notify.email}
                placeholder="equipo@empresa.com"
                onChange={(e) => setSettings({ notify: { ...s.notify, email: e.target.value } })}
              />
            </Field>
            <Field label={t("set.notify.wa")}>
              <input
                type="tel"
                className={inputCls}
                value={s.notify.whatsapp}
                placeholder="+54 9 11 ..."
                onChange={(e) => setSettings({ notify: { ...s.notify, whatsapp: e.target.value } })}
              />
            </Field>
          </div>
          <div className="mt-2">
            <Toggle
              checked={s.notify.onZoneHit}
              onChange={(v) => setSettings({ notify: { ...s.notify, onZoneHit: v } })}
              label={t("set.notify.zone")}
            />
            <Toggle
              checked={s.notify.onSensor}
              onChange={(v) => setSettings({ notify: { ...s.notify, onSensor: v } })}
              label={t("set.notify.sensor")}
            />
            <Toggle
              checked={s.notify.browser}
              onChange={async (v) => {
                if (v && typeof Notification === "undefined") return toast.error(t("set.notify.blocked"));
                if (v && Notification.permission !== "granted") {
                  const r = await Notification.requestPermission().catch(() => "denied");
                  if (r !== "granted") return toast.error(t("set.notify.blocked"));
                }
                setSettings({ notify: { ...s.notify, browser: v } });
              }}
              label={t("set.notify.browser")}
            />
          </div>
          <p className="mt-1 text-[11px] text-foreground/60">{t("set.notify.note")}</p>
        </Card>
      </Group>

      <Group id="set-integrations" title={t("int.title")}>
        <IntegrationsCard ctx={ctx} />
      </Group>

      <Group id="set-data" title={t("set.g.data")}>
        <Card title={t("set.backup")} right={<Database className="size-4 text-foreground/45" aria-hidden />}>
          <p className="mb-3 text-[12.5px] leading-snug text-foreground/70">{t("set.backup.text")}</p>
          <div className="flex flex-wrap gap-2">
            <Btn variant="solid" onClick={downloadBackup}>
              <Download className="size-3.5" /> {t("set.backup.download")}
            </Btn>
            <Btn onClick={() => backupFile.current?.click()}>
              <Upload className="size-3.5" /> {t("set.backup.import")}
            </Btn>
            <input
              ref={backupFile}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                importBackup(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </Card>

        <Card title={t("set.exchange")}>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={exportJson}>
              <Download className="size-3.5" /> {t("set.exportGeo")}
            </Btn>
            <Btn onClick={exportKml}>
              <Download className="size-3.5" /> {t("set.exportKml")}
            </Btn>
            <Btn onClick={() => mapFile.current?.click()}>
              <Upload className="size-3.5" /> {t("set.importMap")}
            </Btn>
            <input
              ref={mapFile}
              type="file"
              accept=".geojson,.json,.kml,application/json,application/vnd.google-earth.kml+xml"
              hidden
              onChange={(e) => {
                importFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </Card>

        <Card title={t("set.danger")}>
          <div className="flex flex-wrap gap-2">
            <Btn
              variant="danger"
              onClick={() =>
                window.confirm(t("set.clear.confirm")) &&
                ctx.replaceWorkspace({ ...ws, features: [], meta: {} })
              }
            >
              <Trash2 className="size-3.5" /> {t("set.clear")}
            </Btn>
            <Btn
              onClick={() => {
                if (!window.confirm(t("set.reset.confirm"))) return;
                setSettings({
                  ...DEFAULT_SETTINGS,
                  org: s.org,
                  locale: s.locale,
                  notify: s.notify,
                  rules: s.rules,
                });
              }}
            >
              {t("set.reset")}
            </Btn>
          </div>
        </Card>
      </Group>

      <Group id="set-sources" title={t("set.g.sources")}>
        <Card>
          <p className="mb-3 text-[12.5px] leading-snug text-foreground/70">{t("set.sources.text")}</p>
          <ul className="mb-3 space-y-1 text-[12.5px] text-foreground/75">
            <li>
              <b>{t("set.src.fires")}</b> {t("set.src.fires.t")}
            </li>
            <li>
              <b>{t("set.src.imagery")}</b> {t("set.src.imagery.t")}
            </li>
            <li>
              <b>{t("set.src.terrain")}</b> {t("set.src.terrain.t")} <b>{t("set.src.weather")}</b>{" "}
              {t("set.src.weather.t")}
            </li>
            <li>
              <b>{t("set.src.sim")}</b> {t("set.src.sim.t")}
            </li>
          </ul>
          <Btn onClick={openSources}>
            <ExternalLink className="size-3.5" /> {t("set.sources.open")}
          </Btn>
        </Card>
      </Group>
    </div>
  );
}
