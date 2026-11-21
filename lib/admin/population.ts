// People near a point, from the national population grid (scripts/fetch-population.mjs).
// Impact half of "risk = probability x impact", as in the flood observatory: a fire with
// 3.000 people within 5 km matters more than a stronger one in an empty field.

export interface PopRaster {
  /** west, south, east, north */
  bbox: [number, number, number, number];
  width: number;
  height: number;
  /** people per cell, row-major from the north-west corner */
  data: Uint32Array;
}

export interface PeopleNear {
  km5: number;
  km10: number;
}

const KM_PER_DEG_LAT = 111.32;

/**
 * People in the cells whose centre lies within `km` of the point.
 * ponytail: whole cells (~2.8 km) in or out, so small radii are coarse; when no cell centre is
 * inside, the containing cell is counted pro rata by area. Good to rank incidents, not to evacuate.
 */
export function peopleWithin(
  r: PopRaster,
  lat: number,
  lng: number,
  km: number,
): number {
  const [west, south, east, north] = r.bbox;
  if (lat < south || lat > north || lng < west || lng > east) return 0;
  const dLat = (north - south) / r.height;
  const dLng = (east - west) / r.width;
  const kmLng = KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
  const y0 = Math.max(
    0,
    Math.floor((north - lat - km / KM_PER_DEG_LAT) / dLat),
  );
  const y1 = Math.min(
    r.height - 1,
    Math.floor((north - lat + km / KM_PER_DEG_LAT) / dLat),
  );
  const x0 = Math.max(0, Math.floor((lng - west - km / kmLng) / dLng));
  const x1 = Math.min(
    r.width - 1,
    Math.floor((lng - west + km / kmLng) / dLng),
  );
  let sum = 0;
  let hit = false;
  for (let y = y0; y <= y1; y++) {
    const cy = north - (y + 0.5) * dLat;
    for (let x = x0; x <= x1; x++) {
      const cx = west + (x + 0.5) * dLng;
      const dy = (cy - lat) * KM_PER_DEG_LAT;
      const dx = (cx - lng) * kmLng;
      if (dx * dx + dy * dy <= km * km) {
        sum += r.data[y * r.width + x];
        hit = true;
      }
    }
  }
  if (hit) return sum;
  const y = Math.min(r.height - 1, Math.floor((north - lat) / dLat));
  const x = Math.min(r.width - 1, Math.floor((lng - west) / dLng));
  const cellKm2 = dLat * KM_PER_DEG_LAT * dLng * kmLng;
  return Math.round(
    r.data[y * r.width + x] * Math.min(1, (Math.PI * km * km) / cellKm2),
  );
}

export const peopleNear = (
  r: PopRaster,
  lat: number,
  lng: number,
): PeopleNear => ({
  km5: peopleWithin(r, lat, lng, 5),
  km10: peopleWithin(r, lat, lng, 10),
});

/** Rounded for display: exact counts from a modelled grid would be false precision. */
export function roundPeople(n: number): number {
  if (n < 100) return Math.round(n / 10) * 10;
  if (n < 10_000) return Math.round(n / 100) * 100;
  return Math.round(n / 1000) * 1000;
}
