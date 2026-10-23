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

### Backtest de la alerta temprana (25/9 al 23/10/2026)

Se midió con 28 días reales de FIRMS para Argentina: 62.364 filas de GOES-19 contra 26.562 detecciones VIIRS de confianza nominal o alta, 1.305 manchas diarias evaluables.

- Método: un punto por mancha y por día (solo FIRMS), la alerta cuenta desde el tercer escaneo más 20 min de entrega, y se la compara con la primera detección VIIRS a menos de 4,5 km en las 24 h siguientes. Se dejaron afuera las manchas sin 24 h de cobertura polar posterior.
- **Cuantos más escaneos, más se confirma:**

| Escaneos | Manchas | Confirmadas por VIIRS | GOES avisó primero | Mediana de ventaja |
|---|---|---|---|---|
| ≥ 3 (umbral actual) | 1.305 | 74 % | 68 % | 103 min |
| ≥ 5 | 987 | 81 % | 71 % | 114 min |
| ≥ 8 | 708 | 87 % | 73 % | 116 min |
| ≥ 12 | 524 | 92 % | 76 % | 125 min |
| ≥ 20 | 330 | 97 % | 81 % | 131 min |

- Por banda (lo que usa el panel como "confianza", `earlyTier` en `lib/admin/early.ts`): menos de 5 escaneos **52 %**, de 5 a 11 **69 %**, 12 o más **92 %**.

**Validación en otro período (31/7 al 25/9/2026, 4.008 manchas, sin haber definido nada con ellas):**

| Banda | Primer período | Validación | Combinado (lo que muestra el panel) |
|---|---|---|---|
| Menos de 5 escaneos | 52 % | 59 % | **57 %** (879 de 1.529) |
| De 5 a 11 | 69 % | 73 % | **72 %** (1.439 de 1.998) |
| 12 o más | 92 % | 92 % | **92 %** (1.643 de 1.786) |

El orden de las bandas se sostiene y la alta da lo mismo en los dos períodos. **La ventaja de tiempo no se sostiene igual:** en la validación GOES avisó primero en 61 % de los casos (52 / 58 / 70 % por banda) y la mediana fue 51 min (5 / 32 / 110 min), contra 68 % y 103 min del primer período. Por eso el panel no promete una ventaja en minutos: solo la tasa de confirmación. Para una cifra de ventaja citable hace falta separar por hora del día y por pasadas disponibles.
- La potencia también cuenta: de 20 a 50 MW se confirma 58 %, de 50 a 100 MW 71 %, desde 100 MW 85 %.
- Límites: la ventaja de la tabla supone alertar al tercer escaneo; con un umbral más alto el aviso llega 10 min más tarde por cada escaneo extra. "Sin confirmar" mezcla falsas alarmas, fuegos chicos que VIIRS no vio y nubes: con estos datos no se separan. No cubre INPE (que ya viene filtrado), ni distingue quema agrícola de incendio forestal. Son tasas históricas, no una promesa.
- El script fue una prueba temporal de Vitest con `parseFirmsGoes`, `mergeEarly` y `parseFireRows`; FIRMS acepta solo 1 o 2 días por pedido de GOES, así que se pidió en ventanas.

### Cuánto tiempo gana GOES, según la hora (84 días, 31/7 al 23/10/2026)

Con las 5.399 manchas evaluables de los 84 días y la alerta contada desde el escaneo que alcanza la persistencia de su banda (3, 5 o 12 escaneos, más 20 min de entrega):

| Hora en que GOES ve el foco (ART) | Manchas | Se confirman | GOES avisa primero | Ventaja cuando avisa primero (mediana) |
|---|---|---|---|---|
| 00 a 06 | 64 | 84 % | 26 % | (muestra chica) |
| **06 a 12** | 971 | 71 % | **99 %** | **137 min** (cuartiles 84 y 200) |
| 12 a 18 | 3.535 | 75 % | 32 % | (la mayoría los confirma el pase de la tarde) |
| **18 a 24** | 829 | 74 % | **100 %** | **181 min** (cuartiles 143 y 302) |
| Todas | 5.399 | 74 % | 54 % | 170 min |

- **La ventaja depende de cuándo pasa el satélite polar, no de qué tan rápido es GOES.** Los VIIRS (NOAA-20 y NOAA-21) solo sobrevuelan Argentina en dos ventanas al día: de **00:30 a 04:00** y de **13:00 a 17:00** hora argentina (935 franjas de 10 min con detecciones en 84 días, ninguna entre las 04:00 y las 13:00 ni entre las 17:00 y las 00:00). Un foco que nace de mañana o de noche espera horas a que pase alguien; uno que nace de tarde suele coincidir con el pase.
- **Lo que sí se puede afirmar:** para focos que GOES ve entre las 18:00 y las 12:00, GOES avisa antes que el satélite polar en casi todos los casos, con una mediana de 2 a 3 horas de ventaja. **Lo que no:** que gane tiempo siempre. Entre las 12:00 y las 18:00 lo hace en 1 de cada 3.
- MODIS agrega pasadas (Terra ~09:00 a 10:30 y ~21:00 a 22:30, Aqua ~04:00 a 05:30 y ~16:00 a 18:00), medidas con una muestra chica (15 días). Las ventanas están en `lib/admin/polar-passes.ts` y el panel las usa para decir cuándo es el próximo pase.
- La banda (baja, media, alta) cambia la tasa de confirmación (58, 72 y 92 % en estos 84 días) más que la ventaja de tiempo.
- Límites: las cifras de ventana de pase salen de una sola estación del año (invierno a primavera); la órbita se desplaza unos minutos por día.

## Temporada: ¿es normal para esta época?

La tarjeta "Temporada" de Métricas (`components/admin/season-card.tsx`) compara los focos de los últimos 10 días con las mismas fechas de los 3 años anteriores.

- **Datos:** `GET /api/admin/history` (`lib/server/history.ts`) pide a NASA FIRMS el CSV por área de Argentina, de a 5 días por pedido. Este año usa `VIIRS_NOAA20_NRT`; los años anteriores, el archivo estándar `VIIRS_NOAA20_SP`. Cuenta por día los focos de confianza nominal o alta dentro del polígono de Argentina.
- **Satélite único (NOAA-20):** es el único que vuela en todos los años comparados (NOAA-21 solo desde 2023). Sumarlo haría que este año parezca "por encima" solo por tener más pasadas. Por eso las cifras son menores que las de la pestaña de focos, que usa NOAA-20 + NOAA-21 + MODIS.
- **Límites:** el tiempo casi real (este año) puede ajustarse al pasar al archivo estándar; los cambios de cobertura o de algoritmo entre años no se corrigen. Un año con algún pedido fallido se devuelve como `null` (no como cero) y se informa con cuántos años se comparó. Si el promedio de los años anteriores es menor a 30 focos en 10 días no se da cociente.
- **Veredicto** (`lib/admin/history-compare.ts`): cociente entre el total de este año y el promedio de los anteriores; menos de 0,7 es "por debajo", más de 1,4 "por encima", en el medio "normal". Los umbrales son una convención del panel, no un estándar.
- **Costo:** 8 pedidos a FIRMS por actualización (2 por año, 4 en paralelo, 15 s cada uno y 30 s en total). El resultado completo queda en memoria 30 minutos por instancia y los pedidos de años pasados se cachean 24 h con `next.revalidate`. No se calculó contra la cuota de FIRMS (5.000 transacciones cada 10 min por clave): a este ritmo queda muy lejos.

## Pendientes conocidos

- **Reglas de Firestore que validen `rev`**: hay una propuesta lista en `docs/firestore-rules-propuesta.md`, sin desplegar y sin probar porque falta Java para el emulador. Instalar Java, correr los casos de esa página y recién ahí desplegar.
- Alertas por correo y WhatsApp, y todo lo que corre sin el panel abierto: necesita servidor propio (ver `db/README.md`).
- Proveedor de mapas base con licencia comercial.
- Aplicación instalable: el manifiesto (`app/manifest.ts`) y los íconos de 192/512 px ya están. No hay service worker a propósito: nada de datos de focos se guarda sin conexión. Falta probar la instalación en un teléfono real (Chrome Android / Safari iOS).
- Advertencias de lint que quedan (nivel warn, fuera de `lib/admin`): `react-hooks/refs` en `admin-app.tsx` y `panel-layers.tsx`/`tour.tsx`, `set-state-in-effect` en varios componentes de interfaz, y los `<a href="/">` y `<img>` de la landing.
- Límite de tamaño del espacio de trabajo en la nube: se mide en caracteres, no en bytes (ver la propuesta de reglas).
- Las pruebas e2e dependen de un servidor `next dev` por puerto: dos corridas a la vez sobre el mismo puerto se pisan. En CI corren como paso obligatorio (`.github/workflows/ci.yml`) y suben el reporte y las trazas si fallan.
