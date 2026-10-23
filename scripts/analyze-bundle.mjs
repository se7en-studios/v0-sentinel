// Uso: npx next build && node scripts/analyze-bundle.mjs [/admin]
// Mide el JS inicial de una ruta (Turbopack) y detecta librerias pesadas por chunk.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import vm from "node:vm";

const route = process.argv[2] ?? "/admin";
const NEXT = ".next";
const kb = (n) => (n / 1024).toFixed(1).padStart(8) + " kB";

const g = { globalThis: {} };
g.globalThis = g;
vm.runInNewContext(readFileSync(`${NEXT}/server/app${route}/page_client-reference-manifest.js`, "utf8"), g);
const man = g.__RSC_MANIFEST[`${route}/page`];
const entry = man.entryJSFiles;
const initial = new Set();
for (const [k, files] of Object.entries(entry)) {
  if (k.endsWith("/app/layout") || k.endsWith(`/app${route}/page`)) files.forEach((f) => initial.add(f));
}
const bm = JSON.parse(readFileSync(`${NEXT}/build-manifest.json`, "utf8"));
[...bm.rootMainFiles, ...bm.polyfillFiles].forEach((f) => initial.add(f));

// Marcadores: texto unico de cada libreria dentro del chunk.
const MARKERS = {
  "maplibre-gl": /maplibre-gl|MapLibre GL JS|maplibregl/,
  recharts: /recharts|ResponsiveContainer/,
  "terra-draw": /terra-draw|TerraDraw/,
  firebase: /firebase|Firestore/i,
  geotiff: /geotiff|GeoTIFF/,
  turf: /@turf|turf/,
  "framer-motion": /framer-motion|motion-dom/,
};
function scan(file) {
  const src = readFileSync(`${NEXT}/${file}`, "utf8");
  const tags = Object.entries(MARKERS).filter(([, re]) => re.test(src)).map(([n]) => n);
  return { size: Buffer.byteLength(src), gz: gzipSync(src).length, tags };
}
const row = (f, s) => `${kb(s.size)} ${kb(s.gz)}  ${f.replace("static/chunks/", "")}  ${s.tags.join(",")}`;

let tot = 0, totGz = 0;
console.log(`JS inicial de ${route} (raw / gzip):`);
for (const f of [...initial].filter((f) => f.endsWith(".js")).sort()) {
  const s = scan(f);
  tot += s.size; totGz += s.gz;
  console.log(row(f, s));
}
console.log(`TOTAL inicial ${kb(tot)} ${kb(totGz)}\n`);

console.log("Chunks diferidos (no en el inicial):");
const all = readdirSync(`${NEXT}/static/chunks`).filter((f) => f.endsWith(".js") && statSync(`${NEXT}/static/chunks/${f}`).isFile());
for (const f of all.map((f) => `static/chunks/${f}`).filter((f) => !initial.has(f))) {
  const s = scan(f);
  if (s.size > 20000) console.log(row(f, s));
}
const servers = [...initial].filter((f) => /geotiff|lib\/server/.test(readFileSync(`${NEXT}/${f}`, "utf8")) );
console.log(`\nChunks iniciales que mencionan geotiff o lib/server: ${servers.length ? servers.join(", ") : "ninguno"}`);

// Bytes de codigo fuente (sin minificar) por paquete en el inicial; requiere ANALYZE_MAPS=1 en el build.
const agg = {};
const add = (map) => {
  if (map.sections) return map.sections.forEach((s) => add(s.map));
  map.sources.forEach((src, i) => {
    const len = (map.sourcesContent?.[i] ?? "").length;
    const nm = src.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?((?:@[^/]+\/)?[^/]+)/);
    const key = nm ? nm[1] : "[app] " + src.replace(/^\[project\]\//, "").split("/").slice(0, 2).join("/");
    agg[key] = (agg[key] ?? 0) + len;
  });
};
for (const f of initial) {
  try {
    const ref = readFileSync(`${NEXT}/${f}`, "utf8").match(/sourceMappingURL=([^\s]+\.map)/)?.[1];
    if (ref) add(JSON.parse(readFileSync(`${NEXT}/static/chunks/${ref}`, "utf8")));
  } catch { /* sin mapa */ }
}
if (Object.keys(agg).length) {
  console.log("\nCodigo fuente por paquete en el inicial (top 25):");
  Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(kb(v), k));
} else console.log("\n(sin sourcemaps: ANALYZE_MAPS=1 npx next build para el desglose por paquete)");

