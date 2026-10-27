// Graba el panel de administración en modo demo (sin login) como video HD y capturas fijas 2×.
// Uso: node scripts/capture-admin.mjs <tour> [segundos]   (tours: caso | general | drones | stills)
// Requiere el sitio corriendo con Firebase vacío:  NEXT_PUBLIC_FIREBASE_*= pnpm dev -p 3500   y ffmpeg en el PATH.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const BASE = process.env.CAPTURE_BASE ?? "http://localhost:3500";
const tour = process.argv[2] ?? "caso";
const seconds = Number(process.argv[3] ?? 16);
const OUT = "public/video";
const TMP = `scripts/.frames-${tour}`;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: process.env.CAPTURE_CHANNEL ?? "chrome",
  args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11", "--enable-zero-copy"],
});
const page = await browser.newPage({ viewport: { width: Number(process.env.VW ?? 1440), height: Number(process.env.VH ?? 810) }, deviceScaleFactor: Number(process.env.DPR ?? 1.3333) });
page.setDefaultTimeout(60000);
await page.addInitScript(() =>
  localStorage.setItem("sentinel-admin-workspace-v1", JSON.stringify({ settings: { onboarded: true } })),
);
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await page.getByRole("navigation", { name: "Modos" }).waitFor();
await page.addStyleTag({ content: "nextjs-portal,[data-nextjs-dev-tools-button],[data-next-badge-root]{display:none!important}" });
await page.waitForTimeout(3500);
await page.getByRole("button", { name: /cerrar|close/i }).first().click({ timeout: 2500 }).catch(() => {}); // cierra «Primeros pasos»
await page.waitForTimeout(800);

const nav = page.getByRole("navigation", { name: "Modos" });
const tab = (re) => nav.getByRole("button", { name: re }).first();

async function setup() {
  if (tour === "caso") {
    await tab(/Incendios/).click();
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /Caso: Puerto Patriada/ }).click();
    await page.waitForTimeout(6500);
  } else if (tour === "caso3d") {
    await tab(/Incendios/).click();
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /Caso: Puerto Patriada/ }).click();
    await page.waitForTimeout(5000);
    await page.getByRole("button", { name: "3D", exact: false }).first().click();
    await page.waitForTimeout(6500);
  } else if (tour === "drones") {
    await tab(/Drones/).click();
    await page.waitForTimeout(5000);
  } else {
    await page.waitForTimeout(3000);
  }
}
await setup();

if (tour === "stills") {
  for (const [name, fn] of [
    ["general", async () => {}],
    ["caso", async () => { await tab(/Incendios/).click(); await page.waitForTimeout(1200); await page.getByRole("button", { name: /Caso: Puerto Patriada/ }).click(); await page.waitForTimeout(7000); }],
  ]) {
    await fn();
    await page.screenshot({ path: `public/product/hd-${name}.png` });
    console.log("still", name);
  }
  await browser.close();
  process.exit(0);
}

// Empieza a reproducir la línea de tiempo (botón ▶) antes de grabar.
const play = page.getByRole("button", { name: /reproducir|play|iniciar/i }).first();
const cdp = await page.context().newCDPSession(page);
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const frames = [];
cdp.on("Page.screencastFrame", async (f) => {
  frames.push({ t: f.metadata.timestamp, data: f.data });
  await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
await page.waitForTimeout(600);
await play.click().catch(() => console.log("sin botón de reproducir"));
await page.waitForTimeout(seconds * 1000);
await cdp.send("Page.stopScreencast");
await browser.close();

console.log(`${frames.length} cuadros en ${(frames.at(-1).t - frames[0].t).toFixed(1)} s`);
const lines = [];
frames.forEach((f, i) => {
  const name = `f${String(i).padStart(5, "0")}.jpg`;
  writeFileSync(`${TMP}/${name}`, Buffer.from(f.data, "base64"));
  const dur = i < frames.length - 1 ? frames[i + 1].t - f.t : 0.05;
  lines.push(`file '${name}'`, `duration ${Math.max(dur, 0.01).toFixed(4)}`);
});
lines.push(`file 'f${String(frames.length - 1).padStart(5, "0")}.jpg'`);
writeFileSync(`${TMP}/list.txt`, lines.join("\n"));
const base = `${OUT}/admin-${tour}`;
const common = ["-y", "-f", "concat", "-safe", "0", "-i", `${TMP}/list.txt`, "-vf", "fps=30,scale=1920:-2:flags=lanczos,format=yuv420p"];
execFileSync("ffmpeg", [...common, "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-movflags", "+faststart", "-an", `${base}.mp4`], { stdio: "ignore" });
execFileSync("ffmpeg", [...common, "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1", "-an", `${base}.webm`], { stdio: "ignore" });
execFileSync("ffmpeg", ["-y", "-ss", "2", "-i", `${base}.mp4`, "-frames:v", "1", "-q:v", "3", `${base}-poster.jpg`], { stdio: "ignore" });
rmSync(TMP, { recursive: true, force: true });
console.log("listo:", base);
