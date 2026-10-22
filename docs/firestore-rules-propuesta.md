# Propuesta de reglas de Firestore (no desplegada)

Estado: **propuesta sin probar contra el emulador**. En esta máquina no hay Java (`java -version` falla) y el emulador de Firestore lo necesita, así que no se agregó `@firebase/rules-unit-testing`. Nada de esto se desplegó; el `firestore.rules` del repo no se tocó.

## Qué cambia y por qué

`lib/admin/cloud.ts` guarda `workspaces/{uid}` con `{ json, rev, clientAt, updatedAt }` y resuelve los conflictos en el cliente (transacción: si `rev` cambió, lanza `ConflictError`). Las reglas actuales solo validan `json`, así que un cliente con el token del dueño (o un bug) puede escribir `rev` hacia atrás o cualquier forma de documento y saltarse la detección de conflictos. La propuesta lo exige también en el servidor:

- `rev` entero; en la creación vale 1; en cada actualización vale exactamente `rev anterior + 1`. Los documentos viejos sin `rev` cuentan como 0 (`get('rev', 0)`).
- Solo las claves `json`, `rev`, `clientAt`, `updatedAt`; `updatedAt` tiene que ser la hora del servidor (`request.time`), que es lo que manda `serverTimestamp()`.
- Se borra solo si es el dueño (hoy un `delete` cae en "write" y falla por `request.resource == null`; queda explícito).

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isOwner(uid) {
      return request.auth != null && request.auth.uid == uid;
    }

    function validWorkspace() {
      let d = request.resource.data;
      return d.keys().hasOnly(['json', 'rev', 'clientAt', 'updatedAt'])
          && d.json is string
          && d.json.size() < 900000
          && d.rev is int
          && d.clientAt is number
          && d.updatedAt == request.time;
    }

    match /workspaces/{uid} {
      allow read: if isOwner(uid);
      allow create: if isOwner(uid) && validWorkspace() && request.resource.data.rev == 1;
      allow update: if isOwner(uid) && validWorkspace()
                    && request.resource.data.rev == resource.data.get('rev', 0) + 1;
      allow delete: if isOwner(uid);
    }

    // match /shares/{token} { ...sin cambios... }
  }
}
```

## Cosas a decidir antes de desplegar

1. **Compatibilidad con `force` ("quedarme con la mía")**: `saveCloud` con `force` igual escribe `current + 1` dentro de la transacción, así que cumple la regla. Si algún día se quisiera pisar con un `rev` arbitrario, la regla lo va a rechazar a propósito.
2. **Tamaño**: `String.size()` cuenta caracteres, no bytes. Firestore limita el documento a 1 MiB en bytes UTF-8, y `JSON.stringify` deja las tildes sin escapar (2 bytes cada una). Con 900 000 caracteres y mucho texto acentuado (notas, nombres) se podría pasar del mebibyte. En `cloud.ts` el límite de 850 000 es sobre `json.length`, con el mismo sesgo. Hoy el GeoJSON es casi todo ASCII, así que no es urgente; si preocupa, bajar ambos a ~500 000.
3. **Documentos existentes** sin `rev`: la primera escritura después del despliegue exige `rev == 1`. Cubierto por `get('rev', 0)`.

## Cómo probarlo (cuando haya Java)

```
# 1. Java 11+ (por ejemplo Temurin) y el CLI
winget install EclipseAdoptium.Temurin.21.JRE
pnpm add -D @firebase/rules-unit-testing firebase-tools

# 2. firebase.json mínimo (no existe en el repo)
{ "firestore": { "rules": "firestore.rules" }, "emulators": { "firestore": { "port": 8080 } } }

# 3. correr las pruebas dentro del emulador
pnpm exec firebase emulators:exec --only firestore "pnpm vitest run firestore.rules.test.ts"
```

Casos que la prueba tiene que cubrir (con `initializeTestEnvironment` + `assertSucceeds` / `assertFails`):

| Caso | Resultado esperado |
|---|---|
| dueño lee su espacio / otro usuario lo lee / anónimo lo lee | ok / falla / falla |
| crear con `rev: 1` / con `rev: 2` / sin `rev` | ok / falla / falla |
| actualizar con `rev = anterior + 1` / igual / menor / `+2` | ok / falla / falla / falla |
| documento viejo sin `rev` actualizado con `rev: 1` | ok |
| clave extra (`admin: true`), `json` no string, `json` de 900 000 caracteres | falla |
| `updatedAt` con fecha del cliente en vez de `serverTimestamp()` | falla |
| borrar el propio / el ajeno | ok / falla |
| `shares`: `get` con token vigente anónimo / vencido; `list` anónimo; crear con `expiresAt` a 9 días | ok / falla / falla / falla |

Después de que pasen, desplegar con `firebase deploy --only firestore:rules` (y mirar antes `firebase deploy --only firestore:rules --dry-run`).
