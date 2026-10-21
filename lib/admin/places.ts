// Reference towns used to describe a hotspot cluster as "a X km de <place>".
// Approximate coordinates, enough for a 5-100 km orientation label.
export const PLACES: [string, string, number, number][] = [
  ["Bariloche", "Río Negro", -41.13, -71.31],
  ["El Bolsón", "Río Negro", -41.96, -71.53],
  ["Viedma", "Río Negro", -40.81, -62.99],
  ["General Roca", "Río Negro", -39.03, -67.58],
  ["Neuquén", "Neuquén", -38.95, -68.06],
  ["San Martín de los Andes", "Neuquén", -40.16, -71.35],
  ["Zapala", "Neuquén", -38.9, -70.06],
  ["Esquel", "Chubut", -42.91, -71.32],
  ["Trelew", "Chubut", -43.25, -65.31],
  ["Comodoro Rivadavia", "Chubut", -45.86, -67.48],
  ["Río Gallegos", "Santa Cruz", -51.62, -69.22],
  ["El Calafate", "Santa Cruz", -50.34, -72.26],
  ["Ushuaia", "Tierra del Fuego", -54.8, -68.3],
  ["Santa Rosa", "La Pampa", -36.62, -64.29],
  ["Bahía Blanca", "Buenos Aires", -38.72, -62.27],
  ["Mar del Plata", "Buenos Aires", -38.0, -57.55],
  ["Buenos Aires", "CABA", -34.6, -58.38],
  ["La Plata", "Buenos Aires", -34.92, -57.95],
  ["Tandil", "Buenos Aires", -37.32, -59.13],
  ["Rosario", "Santa Fe", -32.95, -60.64],
  ["Santa Fe", "Santa Fe", -31.63, -60.7],
  ["Reconquista", "Santa Fe", -29.15, -59.65],
  ["Paraná", "Entre Ríos", -31.73, -60.52],
  ["Concordia", "Entre Ríos", -31.39, -58.02],
  ["Córdoba", "Córdoba", -31.42, -64.18],
  ["Río Cuarto", "Córdoba", -33.13, -64.35],
  ["Villa Carlos Paz", "Córdoba", -31.42, -64.5],
  ["San Luis", "San Luis", -33.3, -66.34],
  ["Mendoza", "Mendoza", -32.89, -68.84],
  ["San Rafael", "Mendoza", -34.62, -68.33],
  ["San Juan", "San Juan", -31.54, -68.54],
  ["La Rioja", "La Rioja", -29.41, -66.86],
  ["Catamarca", "Catamarca", -28.47, -65.78],
  ["Tucumán", "Tucumán", -26.82, -65.22],
  ["Santiago del Estero", "Santiago del Estero", -27.78, -64.26],
  ["Salta", "Salta", -24.78, -65.41],
  ["Orán", "Salta", -23.13, -64.32],
  ["Jujuy", "Jujuy", -24.19, -65.3],
  ["Resistencia", "Chaco", -27.46, -58.98],
  ["Sáenz Peña", "Chaco", -26.79, -60.44],
  ["Formosa", "Formosa", -26.18, -58.17],
  ["Corrientes", "Corrientes", -27.47, -58.83],
  ["Mercedes", "Corrientes", -29.18, -58.08],
  ["Posadas", "Misiones", -27.37, -55.9],
  ["Eldorado", "Misiones", -26.4, -54.63],
];

export function nearestPlace(lat: number, lng: number) {
  const r = Math.PI / 180;
  let best = { near: "", km: Infinity };
  for (const [name, prov, plat, plng] of PLACES) {
    const dLat = (plat - lat) * r;
    const dLng = (plng - lng) * r;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat * r) * Math.cos(plat * r) * Math.sin(dLng / 2) ** 2;
    const km = 12742 * Math.asin(Math.sqrt(h));
    if (km < best.km) best = { near: `${name} (${prov})`, km };
  }
  return { near: best.near, km: Math.round(best.km) };
}
