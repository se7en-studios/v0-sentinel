# Integraciones del servidor

Todo lo de esta página corre en el servidor (rutas `app/api/admin/*`). Ninguna clave llega al navegador ni se guarda en el repositorio: se cargan como variables de entorno (en local, `.env.local`; en producción, Vercel > Settings > Environment Variables). Un canal sin sus variables responde `not-configured` y no rompe nada.

## Avisos: `POST /api/admin/notify`

Requiere sesión de admin (la misma que el resto de `/api/admin/*`). Máximo 10 pedidos por minuto por IP.

Cuerpo (JSON, todo validado, claves desconocidas se rechazan):

| Campo | Tipo | Notas |
|---|---|---|
| `title` | texto 1-120 | obligatorio |
| `message` | texto 1-1000 | obligatorio |
| `severity` | `info` / `warning` / `critical` | por defecto `warning` |
| `link` | URL `https://` | opcional |
| `channels` | `["webhook","email","whatsapp"]` | por defecto, todos |
| `emails` | hasta 10 correos | si falta, usa `NOTIFY_EMAIL_TO` |
| `phones` | hasta 10 teléfonos E.164 (`+5492991234567`) | si falta, usa `NOTIFY_WHATSAPP_TO` |
| `dryRun` | booleano | `true`: valida y cuenta destinatarios, **no envía nada** |

Respuesta: `{ dryRun, results: [{ channel, status, attempted, delivered, error? }] }` con `status` en `sent`, `dry-run`, `not-configured`, `skipped` (sin destinatarios) o `failed`. Los errores informan solo el código HTTP del proveedor, nunca su cuerpo (puede repetir teléfonos o correos). El servidor no registra destinatarios, mensajes ni claves.

Probar sin enviar (con la sesión iniciada, desde la consola del navegador en `/admin`):

```js
await fetch("/api/admin/notify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Prueba", message: "Solo prueba", emails: ["vos@ejemplo.com"], dryRun: true }),
}).then((r) => r.json());
```

(Si la cuenta usa Firebase, el pedido necesita además `Authorization: Bearer <idToken>`.)

### Webhook firmado

| Variable | Qué es |
|---|---|
| `NOTIFY_WEBHOOK_URL` | URL `https://` que recibe el aviso (n8n, Make, Zapier, un servidor propio) |
| `NOTIFY_WEBHOOK_SECRET` | secreto compartido para firmar |

Se envía un `POST` JSON con `X-Sentinel-Timestamp` (segundos Unix) y `X-Sentinel-Signature` = HMAC-SHA256 hex de `` `${timestamp}.${cuerpo}` ``. El receptor debe recalcularlo y rechazar firmas distintas o timestamps con más de 5 minutos de diferencia (`lib/server/webhook-sign.ts` trae `verifyWebhook`, comparación en tiempo constante).

### Correo (Resend)

1. Crear cuenta en resend.com, verificar un dominio propio (DNS: SPF y DKIM) y crear una API key con permiso de envío.
2. Variables: `RESEND_API_KEY` y `NOTIFY_EMAIL_FROM` (ej. `Sentinel <avisos@tudominio.com>`, del dominio verificado). Opcional: `NOTIFY_EMAIL_TO` (lista separada por comas).
3. Se manda un correo por destinatario (nadie ve las direcciones de los demás). Sin dominio verificado Resend solo deja escribir a la casilla del dueño de la cuenta: sirve para probar.

### WhatsApp (Cloud API de Meta)

1. En developers.facebook.com crear una app tipo Business, agregar el producto WhatsApp y vincular una cuenta de WhatsApp Business con un número.
2. Crear y aprobar una **plantilla** de mensaje (categoría Utility) con un único parámetro en el cuerpo, p. ej. `Alerta de incendio: {{1}}`. Los avisos iniciados por la empresa solo pueden ir como plantilla aprobada. El `{{1}}` recibe `título: mensaje [enlace]` en una sola línea (máx. 900 caracteres).
3. Crear un usuario del sistema con token permanente (permiso `whatsapp_business_messaging`).
4. Variables: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`; opcional `WHATSAPP_TEMPLATE_LANG` (por defecto `es_AR`) y `NOTIFY_WHATSAPP_TO` (E.164 separados por comas).
5. Mientras la cuenta esté en modo de prueba solo se puede escribir a números registrados en la consola de Meta. Los destinatarios deben haber aceptado recibir avisos (Ley 25.326 y política de WhatsApp).

## Fuentes de focos y respaldo

| Fuente | Ruta | Clave |
|---|---|---|
| NASA FIRMS (VIIRS NOAA-20/21, MODIS, GOES-19) | `/api/admin/fires`, `/api/admin/early` | `NASA_FIRMS_KEY` |
| INPE, archivos de 10 min (GOES-19) | `/api/admin/early` | ninguna |
| INPE, archivos diarios de América del Sur (satélites polares) | respaldo de `/api/admin/fires` | ninguna |
| AWS (Copernicus DEM, ESA WorldCover) | `/api/admin/terrain` | ninguna |

**Respaldo INPE:** si FIRMS no responde (o falta la clave), `/api/admin/fires` devuelve igual un `FiresPayload` con los focos polares (NOAA-20, NOAA-21, Suomi NPP, Terra, Aqua) de las últimas 48 h, filtrados a Argentina. La respuesta trae `fallback: "INPE"` y en `sources` una entrada `firms-polar` con `ok: false` más cada satélite con la etiqueta "respaldo INPE". Diferencias a tener en cuenta: INPE no informa confianza (todo cuenta como "nominal") ni día/noche (se muestra como día), y el atraso suele ser mayor que el de FIRMS. Se usa el archivo diario y no los de 10 minutos porque 288 pedidos por consulta no son viables y los de 10 min traen casi solo GOES-19. El archivo diario pesa 1,5-5 MB, por eso se cachea ya parseado en memoria del servidor 10 minutos (el caché de `fetch` de Next no guarda más de 2 MB).

## Estado de las fuentes: `GET /api/admin/health`

Sonda corta (tope de 6 s por fuente, en paralelo) de FIRMS VIIRS, FIRMS MODIS, FIRMS GOES, INPE y AWS terreno. Devuelve latencia, frescura (`newestAt`, `ageMin`) y un error fijo por fuente: nunca la clave ni la URL consultada. Máximo 12 por minuto por IP. Cada llamada consume 3 pedidos a FIRMS (la cuota gratuita es de 5000 transacciones por 10 minutos), así que conviene llamarla bajo demanda, no en un intervalo corto.

## Límite de tasa

`lib/server/rate-limit.ts`: ventana deslizante en memoria, por IP (`x-real-ip`, luego `x-forwarded-for`). Límites por minuto: login 8, `fires` y `early` 30, `terrain` 120, `health` 12, `notify` 10. Responde `429` con `Retry-After`.

**Techo:** el contador vive en cada instancia. En Vercel cada contenedor tiene el suyo, así que con N contenedores el máximo real es hasta N veces el límite, y se reinicia en cada arranque en frío. Alcanza para frenar fuerza bruta casual y abuso accidental, no un ataque distribuido. Para un límite firme: Upstash Redis (`@upstash/ratelimit`, reemplaza solo `createLimiter`) o una regla de Vercel Firewall sobre `/api/admin/*`.

## Cabeceras de seguridad

En `next.config.mjs`, para todas las rutas: CSP, `X-Frame-Options: DENY` y `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (cámara, micrófono, geolocalización, pagos y USB apagados) y HSTS en producción.

La CSP enumera los dominios del mapa (Esri, EOX, CARTO, NASA GIBS, OpenFreeMap, AWS S3), Open-Meteo, Nominatim, NASA POWER (`power.larc.nasa.gov`, el clima de cada incendio en la pestaña Incendios), `*.googleapis.com` (Firebase) y Vercel Analytics. **Si agregás una fuente nueva de teselas o una API consumida desde el navegador, sumá su dominio a `MAP_HOSTS`/`API_HOSTS`**, o el navegador la bloquea (se ve como error `Refused to connect` en la consola). Concesiones: `script-src` permite `'unsafe-inline'` (el arranque de Next y los JSON-LD; un nonce obligaría a renderizar todo dinámico) y `img-src` permite cualquier `https:` (imágenes de prensa y teselas). `'unsafe-eval'` solo se agrega en desarrollo.

## Desde el panel: Configuración > Integraciones

- **Estado de las fuentes** llama a `GET /api/admin/health` al apretar "Revisar ahora" (no hay consulta automática, por la cuota de FIRMS). Cada fuente se muestra como activa, lenta (responde en más de 3 s) o sin respuesta, con latencia y antigüedad del último dato.
- **Probar avisos** llama a `POST /api/admin/notify`. Por defecto va con `dryRun: true` (casilla "Solo simular, no enviar"); un envío real exige desmarcarla y confirmar en la página. Los destinatarios no se eligen en el panel: salen de `NOTIFY_EMAIL_TO` y `NOTIFY_WHATSAPP_TO` del servidor, y el panel solo muestra el estado por canal (nunca direcciones, teléfonos ni textos de error del proveedor).
- Las dos llamadas usan `ctx.authedFetch`, que agrega el token de la sesión cuando hay cuenta.

## Deshacer una importación de respaldo

Importar un respaldo (o vaciar zonas) reemplaza todo el espacio de trabajo. "Deshacer" lo restaura completo (zonas, notas, bitácora, acuses, incidentes, operación y ajustes) y "Rehacer" vuelve a la importación. Las ediciones normales siguen deshaciendo solo zonas y metadatos. Deshacer pasa por el mismo camino que cualquier edición, así que la copia local y la nube se actualizan solas (`rev` y `dirty` no se tocan a mano).
