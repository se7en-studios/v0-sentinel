// Perfil de CPU de un refresco de datos con 2.500 focos simulados (build de produccion con next start).
// Uso: ADMIN_PASSWORD=perf npx next start -p 3199 ; node scripts/profile-refresh.mjs 3199 refresh|idle .next/static/chunks
// Ignora el tiempo nativo/WebGL (el render por software de Chrome headless no es medible); mira los archivos de la app.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const dir = process.argv[4];
const [port = "3199", mode = "idle"] = process.argv.slice(2);
const base = `http://localhost:${port}`;
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const days = Array.from({ length: 10 }, (_, i) => new Date(Date.now() - (9 - i) * 864e5).toISOString().slice(0, 10));
const centers = Array.from({ length: 40 }, () => [-45 + rnd() * 20, -72 + rnd() * 10]);
const points = Array.from({ length: 2500 }, () => { const c = centers[Math.floor(rnd() * 40)]; return [c[0] + (rnd() - 0.5) * 0.4, c[1] + (rnd() - 0.5) * 0.4, +(rnd() * 80).toFixed(1), Math.floor(rnd() * 3), Math.floor(rnd() * 10), Math.floor(rnd() * 24) * 100 + 30, rnd() > 0.5 ? 1 : 0, 1]; });
const body = JSON.stringify({ updated: new Date().toISOString(), days, points, clusters: [], fetchedAt: Date.now(), newestDetectionAt: Date.now() });
const browser = await chromium.launch({ channel: "chrome", args: ["--disable-gpu"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 } });
const page = await ctx.newPage();
await page.route("**/api/admin/fires*", (r) => r.fulfill({ contentType: "application/json", body }));
await page.route("**/api/admin/early*", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ early: [], updated: "", sources: [] }) }));
await page.route(/(open-meteo|openstreetmap|arcgisonline|cartocdn|eox\.at|earthdata|openfreemap|amazonaws)/, (r) => r.abort());
await page.request.post(`${base}/api/admin/login`, { data: { password: "perf" } });
const cdp = await ctx.newCDPSession(page);
await page.goto(`${base}/admin`);
await page.getByRole("navigation", { name: "Modos" }).waitFor();
const demo = page.getByRole("button", { name: "O probá con datos de ejemplo" });
if (await demo.count()) await demo.click();
await page.waitForTimeout(4000);
await cdp.send("Profiler.enable");
await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
await cdp.send("Profiler.start");
if (mode === "idle") await page.waitForTimeout(15000);
else { const r = page.getByRole("button", { name: /Actualizar/i }).first(); for (let i = 0; i < 6; i++) { await r.click(); await page.waitForTimeout(2500); } }
const { profile } = await cdp.send("Profiler.stop");
const dt = profile.timeDeltas; const self = new Map(); const byId = new Map(profile.nodes.map((n) => [n.id, n]));
profile.samples.forEach((id, i) => self.set(id, (self.get(id) ?? 0) + (dt[i] ?? 0)));
const agg = new Map(); let total = 0;
for (const [id, t] of self) { const n = byId.get(id); const cf = n.callFrame; const f = cf.functionName || "(anon)"; const u = cf.url.replace(/^.*\/_next\/static\/chunks\//, "") || "(native)"; const k = `${f} @ ${u}:${cf.lineNumber}:${cf.columnNumber}`; agg.set(k, (agg.get(k) ?? 0) + t); total += t; }
// por chunk
const byUrl = new Map(); for (const [k, t] of agg) { const u = k.split(" @ ")[1].split(":")[0]; byUrl.set(u, (byUrl.get(u) ?? 0) + t); }
console.log(`mode=${mode} total ${(total / 1000).toFixed(0)}ms`);
console.log("-- por archivo"); [...byUrl].sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([k, t]) => console.log((t / 1000).toFixed(0).padStart(6), k));
console.log("-- por funcion");
[...agg].sort((a, b) => b[1] - a[1]).slice(0, 22).forEach(([k, t]) => {
  let snip = "";
  const m = k.match(/@ ([^:\s]+\.js):(\d+):(\d+)/);
  if (m && dir) {
    try {
      const L = readFileSync(dir + "/" + m[1], "utf8").split("\n")[+m[2]];
      snip = L.slice(+m[3], +m[3] + 100).replace(/\s+/g, " ");
    } catch {}
  }
  console.log((t / 1000).toFixed(0).padStart(6), k.slice(0, 50), "|", snip);
});
await browser.close();
