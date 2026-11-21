# Verificación del FWI: centro

Región -66,-34,-62,-29 (W,S,E,N), del 2025-08-01 al 2025-10-15, 20 celdas de 1°.
FWI calculado con ERA5 (Open-Meteo, mediodía local). Inicio de fuego: foco VIIRS de confianza nominal o alta (NASA FIRMS) sin otro foco a menos de 5 km en los 5 días previos.
Umbrales locales: `data/fwi-climate-ar.json` (2019-01-01..2024-12-31), fuera del período verificado.
Generado con `scripts/verify-fwi.mjs`.

| Criterio | AUC | Celda-días en muy alto o extremo | Veces más días con inicios (muy alto o extremo vs bajo) |
|---|---|---|---|
| Clases canadienses (actual) | 0.483 | 26.8 % | 0.9 |
| Percentiles locales del año | 0.475 | 10.3 % | 0.8 |
| Percentiles locales de la época (±1 mes) | 0.488 | 5.9 % | 1.0 |

AUC: probabilidad de que un día con un inicio de fuego quede en una clase más alta que un día sin fuego (0,5 = azar, 1 = perfecto).

### Clases canadienses (actual)

| Clase FWI | Celda-días | Días con al menos un inicio de fuego | Inicios por celda-día |
|---|---|---|---|
| Bajo | 387 | 25.6 % | 0.43 |
| Moderado | 328 | 29.3 % | 0.65 |
| Alto | 398 | 27.9 % | 0.63 |
| Muy alto | 195 | 22.1 % | 0.44 |
| Extremo | 212 | 23.1 % | 0.32 |

### Percentiles locales del año

| Clase FWI | Celda-días | Días con al menos un inicio de fuego | Inicios por celda-día |
|---|---|---|---|
| Bajo | 820 | 27.9 % | 0.60 |
| Moderado | 362 | 24.6 % | 0.49 |
| Alto | 181 | 23.8 % | 0.35 |
| Muy alto | 85 | 22.4 % | 0.34 |
| Extremo | 72 | 25.0 % | 0.26 |

### Percentiles locales de la época (±1 mes)

| Clase FWI | Celda-días | Días con al menos un inicio de fuego | Inicios por celda-día |
|---|---|---|---|
| Bajo | 1172 | 26.8 % | 0.57 |
| Moderado | 172 | 24.4 % | 0.38 |
| Alto | 86 | 20.9 % | 0.34 |
| Muy alto | 51 | 31.4 % | 0.33 |
| Extremo | 39 | 20.5 % | 0.23 |

Límites: verifica el índice con el tiempo observado, no el pronóstico a 7 días; un inicio puede ser una quema agrícola; las
celdas de los umbrales locales miden 2° (~220 km).
