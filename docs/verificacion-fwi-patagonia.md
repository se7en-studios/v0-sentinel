# Verificación del FWI: patagonia

Región -72.5,-46,-69,-37 (W,S,E,N), del 2025-01-01 al 2025-02-28, 36 celdas de 1°.
FWI calculado con ERA5 (Open-Meteo, mediodía local). Inicio de fuego: foco VIIRS de confianza nominal o alta (NASA FIRMS) sin otro foco a menos de 5 km en los 5 días previos.
Umbrales locales: `data/fwi-climate-ar.json` (2019-01-01..2024-12-31), fuera del período verificado.
Generado con `scripts/verify-fwi.mjs`.

| Criterio | AUC | Celda-días en muy alto o extremo | Veces más días con inicios (muy alto o extremo vs bajo) |
|---|---|---|---|
| Clases canadienses (actual) | 0.599 | 60.1 % | 9.4 |
| Percentiles locales del año | 0.456 | 35.2 % | 1.0 |
| Percentiles locales de la época (±1 mes) | 0.493 | 17.6 % | 0.7 |

AUC: probabilidad de que un día con un inicio de fuego quede en una clase más alta que un día sin fuego (0,5 = azar, 1 = perfecto).

### Clases canadienses (actual)

| Clase FWI | Celda-días | Días con al menos un inicio de fuego | Inicios por celda-día |
|---|---|---|---|
| Bajo | 422 | 0.9 % | 0.01 |
| Moderado | 142 | 2.1 % | 0.02 |
| Alto | 283 | 10.6 % | 0.12 |
| Muy alto | 306 | 10.5 % | 0.13 |
| Extremo | 971 | 8.4 % | 0.10 |

### Percentiles locales del año

| Clase FWI | Celda-días | Días con al menos un inicio de fuego | Inicios por celda-día |
|---|---|---|---|
| Bajo | 126 | 4.0 % | 0.04 |
| Moderado | 418 | 7.4 % | 0.09 |
| Alto | 489 | 7.4 % | 0.08 |
| Muy alto | 277 | 4.0 % | 0.05 |
| Extremo | 283 | 4.2 % | 0.05 |

### Percentiles locales de la época (±1 mes)

| Clase FWI | Celda-días | Días con al menos un inicio de fuego | Inicios por celda-día |
|---|---|---|---|
| Bajo | 764 | 5.8 % | 0.07 |
| Moderado | 316 | 7.3 % | 0.09 |
| Alto | 233 | 6.9 % | 0.08 |
| Muy alto | 133 | 3.8 % | 0.04 |
| Extremo | 147 | 4.8 % | 0.05 |

Límites: verifica el índice con el tiempo observado, no el pronóstico a 7 días; un inicio puede ser una quema agrícola; las
celdas de los umbrales locales miden 2° (~220 km).
