# Rendimiento del admin

## Segunda pasada (22/11/2026)

Medido con build de producción en modo demo, misma máquina, contra la rama anterior (`feat/admin-riesgo-observatorio`) en un worktree aparte. Dos corridas por lado.

| | Antes | Después |
|---|---|---|
| JS inicial de /admin (gzip) | 842 kB | 449 kB (−47 %) |
| CPU con el panel quieto 10 s (TaskDuration, 2.500 focos) | 951 / 984 ms | 59 / 60 ms (−94 %) |
| Cuadros que pide el mapa en reposo | ~20 por segundo | 0 |
| JS al mover el mouse y arrastrar el mapa (≈3 s) | 573 / 624 ms | 334 / 344 ms (−43 %) |

Qué lo explica:

- **JS inicial:** `admin-app.tsx` importaba directo el dock de Incendios (recharts) y sus capas del mapa (maplibre). Ahora son `next/dynamic`. Era una regresión desde la pasada de octubre (que había dejado 390-451 kB).
- **Reposo:** `map/ambient.ts` cambiaba una propiedad de pintura cada ~100 ms (pulso del brillo de los focos y flujo de los recorridos), y cada cambio repinta el mapa entero. El brillo ahora es fijo y el flujo corre solo si hay un recorrido dibujado, con un temporizador en lugar de un bucle por cuadro.
- **Mouse y cámara:** la posición del cursor y la cámara vivían en el estado de la raíz, así que cada movimiento re-renderizaba todo el admin. Ahora están en `map/cursor-store.ts` y solo los leen el lector de coordenadas, la brújula, la escala y la regla.
- **Refrescos:** `keepUnchanged` (`lib/admin/fires-parse.ts`) conserva los arreglos de focos cuando un refresco trae los mismos datos, así la clasificación, los incidentes y las fuentes del mapa no se recalculan ni se vuelven a mandar al worker.

Cómo repetirlo: los scripts de medición de esta pasada (`idle-cpu`, `raf-probe`, `move-probe`) siguen el mismo patrón que `scripts/profile-refresh.mjs` (Playwright + CDP `Performance.getMetrics`, focos simulados). La CPU en reposo es la cifra más estable.

Pendiente conocido: `/api/admin/live` (pestaña Incendios) tarda ~13 s en frío la primera vez por instancia y responde 3,4 MB; después queda en memoria media hora (0,8 s).

