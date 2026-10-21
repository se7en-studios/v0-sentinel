// Annual burned area in Argentina. Only years with a figure we could trace
// are listed; 2021/2022/2025 are left out instead of estimated. Validate
// against the official SNMF (Servicio Nacional de Manejo del Fuego) reports
// before using these in a client deliverable.
export const BURNED_HISTORY = [
  {
    year: 2020,
    ha: 1_151_931,
    source: "MAyDS, citado por FARN",
    url: "https://farn.org.ar/wp-content/uploads/2021/07/DOC_ARGENTINA-INCENDIADA_links-1.pdf",
  },
  {
    year: 2023,
    ha: 500_821,
    source: "SNMF, vía prensa",
    url: "https://www.airedesantafe.com.ar/ambiente/radiografia-los-incendios-cuanta-superficie-se-quemo-2024-y-cuales-fueron-las-provincias-mas-afectadas-n608614",
  },
  {
    year: 2024,
    ha: 301_604,
    source: "SNMF, vía prensa",
    url: "https://www.airedesantafe.com.ar/ambiente/radiografia-los-incendios-cuanta-superficie-se-quemo-2024-y-cuales-fueron-las-provincias-mas-afectadas-n608614",
  },
];

// One VIIRS 375 m pixel covers ~14 ha: upper bound of area per detection.
export const HA_PER_DETECTION = 14.06;
