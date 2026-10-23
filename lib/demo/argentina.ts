import countries from "@/data/latam-countries.json";
import { buildCountry, type CountryGeo } from "./geo";

// Built once on the server (page.tsx) so the 60 kB file never ships to the browser.
export const ARGENTINA: CountryGeo = buildCountry(countries, "Argentina");
