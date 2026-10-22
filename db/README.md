# Base de datos de Sentinel (borrador)

> **Estado: borrador sin aplicar.** Nada de esto corre en ningún entorno. Hay que revisarlo y probarlo en un proyecto de prueba antes de usarlo.

`migrations/0001_init.sql` define el esquema que reemplaza, por fases, al documento JSON único por usuario que hoy guarda Firestore (`workspaces/{uid}`):

- **Organizaciones y roles:** `orgs`, `memberships` (`owner`, `admin`, `operator`, `viewer`).
- **Territorio:** `sites` y `features` (zonas, líneas, rutas y sensores como geometrías PostGIS).
- **Detección:** `observations` (con fuente, hora de adquisición y de recepción, potencia, confianza, puntaje y motivo de ruido).
- **Respuesta:** `alerts` (con `dedupe_key`), `incidents`, `incident_notes`, `tasks`.
- **Entrega:** `contacts`, `escalation_policies` y `deliveries`, con clave única por alerta, canal y destinatario para que reintentar nunca duplique un mensaje.
- **Auditoría:** `audit_log`, solo para agregar.

## Antes de usarlo

1. Probar la migración completa en un proyecto de Supabase vacío y verificar que se aplica y que se puede revertir.
2. Escribir pruebas de las políticas de seguridad por fila: un miembro de otra organización no debe leer nada, y un `viewer` no debe poder escribir.
3. Resolver el pendiente que figura al final del SQL: hoy un `viewer` ve todos los sitios de su organización. Falta filtrar por `memberships.site_ids`.
4. Decidir cómo se vinculan las cuentas existentes de Firebase con `memberships.user_id` durante la migración.
5. Registrar las bases ante la AAIP (los contactos incluyen teléfonos y correos, datos personales según la Ley 25.326) y documentar la región del alojamiento.

## Plan de migración por fases

1. Cron de ingesta que copia FIRMS a `observations`; la ruta actual queda como respaldo.
2. Organización personal por usuario con escritura doble: se sigue escribiendo el documento original y también las tablas.
3. Reglas y alertas del servidor en modo sombra durante dos semanas, y recién entonces activas.
4. Zonas y rutas pasan a `features`; el documento queda como respaldo de solo lectura durante 30 días.
