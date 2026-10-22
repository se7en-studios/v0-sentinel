import inside from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import countries from "@/data/latam-countries.json";

/** west,south,east,north around Argentina; the country polygon filters the rest. */
export const AR_BBOX = "-74,-56,-52,-21";

const argentina = (countries as GeoJSON.FeatureCollection).features.find(
  (f) => (f.properties as { name?: string } | null)?.name === "Argentina",
) as GeoJSON.Feature<GeoJSON.MultiPolygon> | undefined;

export const inArgentina = (lat: number, lng: number) =>
  !argentina || inside(point([lng, lat]), argentina);
