# Verificación del FWI: patagonia

Región -72.5,-46,-69,-37 (W,S,E,N), del 2025-01-01 al 2025-02-28, 36 celdas de 1°.
FWI calculado con ERA5 (Open-Meteo, mediodía local); focos VIIRS de confianza nominal y alta (NASA FIRMS).
Generado con `scripts/verify-fwi.mjs`.

| Clase FWI | Celda-días | Días con al menos un foco | Focos por celda-día |
|---|---|---|---|
| Bajo | 422 | 5.9 % | 5.02 |
| Moderado | 142 | 14.1 % | 7.49 |
| Alto | 283 | 31.4 % | 21.78 |
| Muy alto | 306 | 20.3 % | 10.74 |
| Extremo | 971 | 16.9 % | 3.34 |

**Lectura:** en los días de peligro muy alto o extremo hubo al menos un foco en el 17.7 % de las celdas, contra
el 5.9 % en los días de peligro bajo (3.0 veces más).

Límites: verifica el índice con el tiempo observado, no el pronóstico a 7 días; un incendio grande suma muchos focos; las
clases son las canadienses genéricas, sin calibrar para Argentina.
