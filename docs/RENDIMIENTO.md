# Rendimiento del admin

Mediciones del 23/10/2026 sobre `/admin`, antes y después de la pasada de rendimiento. Todo se midió con build de producción (Turbopack, Next 16.1.6) en la misma máquina; "antes" es el commit `c005a94`.

## Cómo medir

**JS inicial** (determinista, no depende de la máquina):

```
npx next build
node scripts/analyze-bundle.mjs            # chunks del primer render de /admin: bytes crudos y gzip
ANALYZE_MAPS=1 npx next build && node scripts/analyze-bundle.mjs   # además, código fuente por paquete
```

El script lee `page_client-reference-manifest.js` de la ruta, suma los chunks del layout y de la página más los de arranque de Next, y marca qué librería aparece en cada chunk. También avisa si `geotiff` o `lib/server` entran al bundle del cliente.

**Hilo principal** (necesita build en modo demo, sin Firebase, y la clave `perf`):

```
NEXT_PUBLIC_FIREBASE_API_KEY= NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN= NEXT_PUBLIC_FIREBASE_PROJECT_ID= NEXT_PUBLIC_FIREBASE_APP_ID= npx next build
ADMIN_PASSWORD=perf npx next start -p 3199
node scripts/profile-refresh.mjs 3199 refresh .next/static/chunks
```

Abre la vista General con 2.500 focos simulados (40 núcleos en el sur argentino, 10 días), carga los datos de ejemplo, dispara 6 refrescos de datos y corre el perfilador de CPU de Chrome por CDP. Atribuye tiempo propio por archivo y por función. El render WebGL por software de Chrome headless (casi todo el "native" y el chunk de maplibre) no es representativo y se ignora: se compara solo el código de la app.

## Resultados

### JS inicial de /admin (gzip, primer render)

| | Antes | Después |
|---|---|---|
| Con Firebase configurado (producción) | 723 kB | 451 kB (-37 %) |
| Modo demo, descarga real hasta ver la barra de modos (incluye el mapa si ya llegó) | 724 kB | 390-396 kB |

Qué lo explica, en gzip:

- recharts (~125 kB repartidos en tres chunks): salió del inicial. Las gráficas de los docks viven en `components/admin/dock-charts.tsx` y se cargan con `next/dynamic` tras la hidratación. Las vistas Métricas, Pronóstico e Incidentes ya eran diferidas.
- Firestore (~75 kB): el login solo necesita Auth. `lib/admin/firebase.ts` ya no importa Firestore; vive en `lib/admin/firebase-db.ts` y solo lo cargan la sincronización en la nube y los enlaces compartidos (que ya eran `import()` dinámicos).
- `@turf/buffer` con jsts (451 kB de fuente): ahora se descarga bajo demanda (`lib/admin/buffer.ts`, `useBufferReady`) cuando hay una zona con margen o se arma un anillo de patrulla.
- En modo demo, `FirebaseGate` ya no se descarga (import dinámico en `app/admin/page.tsx`).
- Chunks diferidos como antes: mapa (maplibre + terra-draw, 330 kB, `ssr: false`).
- `geotiff` y `lib/server/*` no entran al bundle del cliente (verificado por el script).

Queda en el inicial, sin tocar: React/Next, Firebase Auth (~130 kB, necesario para el login con cuentas), el código de la app con los tres idiomas, lucide, radix, sonner y d3-geo.

### Hilo principal (6 refrescos con 2.500 focos, solo código de la app)

| | Antes | Después |
|---|---|---|
| Tiempo de CPU del código de la app | ~670 ms | ~390 ms (-42 %) |
| Por refresco (incluye ticks del reloj) | ~110 ms | ~65 ms |

Con la máquina ocupada hay ±30 % de ruido; se repitió 3 veces cada lado (669/686/644 ms antes; 308/481/371 ms después). En reposo (solo el reloj) el código de la app consume ~7 ms por segundo, despreciable; el resto del tiempo es el mapa.

Dónde estaba el costo (perfil "antes") y qué se hizo:

- `classifyPoints` (ruido industrial): claves de texto "i:j" y `split` por punto, 49 consultas de texto por punto. Ahora claves numéricas y los índices de píxel se calculan una vez.
- `buildIncidents`: se calculaba 3 veces por refresco y armaba los contornos de todos los grupos antes de quedarse con 20 o 60. Ahora ordena por FRP primero y construye solo los que quedan, y cachea por arreglo de focos y límite (popup "Ver incidente", pestaña Incidentes y regla de crecimiento comparten el cálculo). La agrupación también se cachea, se evitó la copia de arreglos que la hacía cuadrática y las celdas del salto de fuego usan claves numéricas.
- `firesInZone`: el margen de cada zona se recalculaba con jsts en cada refresco. Ahora el polígono con margen y su caja se cachean por geometría de la zona (las zonas son inmutables).
- Etiquetas del timeline: cada marca creaba un formateador `Intl` nuevo por render (`toLocale*String`). Ahora hay formateadores cacheados.
- `pointTs`: se parseaba la misma fecha varias veces por foco (estadísticas, serie, zonas, playback). Ahora una vez por foco.

No se tocó `React.memo` ni selectores: `ctx` es un objeto nuevo en cada render y la mayor parte del costo restante está en el mapa (copia estructurada de los 2.500 focos al worker de maplibre), fuera de esta pasada.

## Supuestos y límites

- Los focos son sintéticos (misma forma que `/api/admin/fires`), no datos reales de FIRMS.
- El orden de magnitud del hilo principal depende de la máquina; lo estable es la proporción antes/después.
- El primer render de una zona con margen espera a que cargue el chunk de `@turf/buffer` (fracción de segundo); hasta entonces no se calculan sus focos, para no mostrar un conteo parcial.
