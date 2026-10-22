# Desarrollo del panel de administración

Guía corta para trabajar en `/admin`. El plan completo de tareas está en el artefacto "Plan de desarrollo del admin".

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo (puerto 3000). |
| `pnpm typecheck` | `tsc --noEmit`. |
| `pnpm lint` | ESLint. Hay avisos de `react-hooks` en nivel advertencia, ver `eslint.config.mjs`. |
| `pnpm test` | Vitest sobre `lib/**/*.test.ts` (lógica pura y hooks con jsdom). |
| `pnpm test:coverage` | Lo mismo, con cobertura de `lib/admin`. |
| `pnpm test:e2e` | Playwright contra el modo demo, con el Chrome instalado (no descarga navegadores). |
| `pnpm build` | Build de producción. Hacen falta las variables `NEXT_PUBLIC_FIREBASE_*` (sirven valores ficticios). |

### Modo demo sin Firebase

Con las cuatro variables `NEXT_PUBLIC_FIREBASE_*` vacías y sin `ADMIN_PASSWORD`, `/admin` abre sin login con un espacio de trabajo local. Playwright lo levanta solo así. Para ver el login de contraseña, definí `ADMIN_PASSWORD`.

## Estructura

```
app/admin/                 página, error y vista compartida de solo lectura
app/api/admin/             focos (FIRMS), login y logout
components/admin/
  use-admin.ts             compone los hooks y arma el objeto que usa toda la interfaz (Ctx)
  hooks/                   un hook por responsabilidad: reloj, focos, reproducción, elementos,
                           zonas, clima y riesgo, simulación, feed y exportes, avisos, tema
  map/                     el mapa partido en módulos: arranque, capas, marcadores, medición
  *-view.tsx, panel-*.tsx  las vistas y paneles
lib/admin/                 lógica pura, sin React, con tests (reglas, incidentes, ruido, FWI,
                           KML, CAP, informes, sincronización)
lib/server/                utilidades para el servidor (firma de webhooks)
db/                        borrador del esquema Postgres, SIN aplicar
e2e/                       pruebas de humo con Playwright
```

## Convenciones

- **La lógica va en `lib/` como funciones puras con tests;** los componentes solo la usan. Lo mismo debe poder correr en el navegador y en el servidor.
- **Todo dato que viene de afuera se limpia:** lo guardado (localStorage, Firestore) y lo importado pasan por `parseWorkspace` y los `clean*` de cada módulo. Un dato malformado se descarta, nunca rompe el panel.
- **Inmutabilidad:** se crean objetos nuevos, no se modifican los existentes.
- **Lo riesgoso sale apagado:** `lib/flags.ts` (`NEXT_PUBLIC_FLAG_<NOMBRE>` o la clave `sentinel-flags` en localStorage).
- **Cada tarea termina con:** tipos y tests en verde, lint sin avisos nuevos, `build`, y verificación en pantalla en escritorio y a 390 px.

## El espacio de trabajo (`Workspace`)

Se guarda como un único JSON por cuenta (hasta 900 KB en Firestore) y en localStorage. Campos: `features`, `meta`, `settings`, `notes`, `ops` (despachos y bitácora de operaciones), `noteLog` (bitácora con autor y hora), `alertAck` (alertas reconocidas o pospuestas) e `incidentMeta` (estado y responsable de cada incidente).

La sincronización (`lib/admin/store.ts` y `cloud.ts`) usa un número de revisión y una transacción: dos pestañas o dispositivos no se pisan en silencio, y ante un conflicto el panel deja elegir. Cada campo nuevo del espacio de trabajo necesita su función `clean*` y un test.

## Fuentes satelitales

| Fuente | Qué aporta | Dónde |
|---|---|---|
| NASA FIRMS · VIIRS NOAA-20 y NOAA-21 | focos de 375 m, entre 2 y 3 pasadas por día cada uno | `/api/admin/fires`, `lib/firms.ts` |
| NASA FIRMS · MODIS (Terra y Aqua) | focos de 1 km; Terra pasa unas horas antes que los VIIRS. Se descarta lo que VIIRS ya vio a menos de 1 km y 1 h (`lib/admin/fires-parse.ts`) | `/api/admin/fires` |
| GOES-19 por NASA FIRMS (`GOES_NRT`) y por INPE (archivos de 10 min, sin clave) | alerta temprana: Argentina cada 10 minutos con ~20 min de demora, píxeles de 2 a 4 km | `/api/admin/early`, `lib/server/early-sources.ts` |
| ESA WorldCover 10 m y Copernicus DEM GLO-30 (AWS Open Data, leídos con `geotiff`) | combustible, elevación, pendiente y exposición bajo un punto | `/api/admin/terrain`, `lib/server/terrain.ts` |

- **Suomi NPP deja de entregar el 2026-11-01**; por eso no se suma.
- **GOES es crudo y ruidoso.** FIRMS lista el mismo píxel en cada escaneo y mezcla Meteosat, que se descarta (945 de 1.066 píxeles aparecían una sola vez). Un punto solo de FIRMS exige 3 escaneos; INPE ya filtra, alcanza uno. Cada alerta temprana está *abierta* hasta que un satélite polar la confirma a menos de 4,5 km (`resolveEarly`), y se *descarta* si cae sobre un sitio industrial o un píxel fijo.
- **Las alertas tempranas se consultan cada 5 minutos**, aparte de los focos polares (cada 30), y entran a los avisos y al contador de alertas solo si caen dentro de una zona o de su radio.
- **El terreno se consulta al hacer clic** en un foco o al abrir un incidente (1 a 4 s la primera vez, después queda en memoria). Los buckets de AWS no tienen CORS, por eso pasa por el servidor.
- **No integrado todavía** (piden cuenta propia): Sentinel-3 SLSTR (EUMETSAT, EUMDAC) y Meteosat LSA SAF. El segundo casi no cubre Argentina; el primero sumaría pasadas polares nuevas.
- **Licencias:** `components/admin/sources-card.tsx` lista cada fuente con su atribución. Open-Meteo gratuito es para uso no comercial: antes de vender el servicio hace falta su plan de pago.

## Pendientes conocidos

- Reglas de Firestore que validen la revisión: hace falta el emulador para probarlas antes de desplegar.
- Alertas por correo y WhatsApp, y todo lo que corre sin el panel abierto: necesita servidor propio (ver `db/README.md`).
- Aplicación instalable: faltan íconos de 192 y 512 px.
- Proveedor de mapas base con licencia comercial.
