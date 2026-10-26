import { expect, test } from "vitest";
import {
  isInArgentina,
  isReliable,
  parseFirmsCsv,
  topByFrp,
  withinHours,
} from "./firms";
import { curateNews, isRelevant, type NewsItem } from "./news";
import { riskLabel } from "./risk";

const HEADER = "latitude,longitude,confidence,acq_date,acq_time,frp";

test("parseFirmsCsv reads rows and drops unusable coordinates", () => {
  const pts = parseFirmsCsv(
    `${HEADER}\n-41.1,-71.3,h,2026-10-26,1405,12.5\nx,y,n,2026-10-26,0100,1`,
  );
  expect(pts).toHaveLength(1);
  expect(pts[0]).toMatchObject({ lat: -41.1, confidence: "h", frp: 12.5 });
  expect(parseFirmsCsv("")).toEqual([]);
  expect(parseFirmsCsv("a,b\n1,2")).toEqual([]);
});

test("withinHours is a rolling window, not the UTC day", () => {
  const now = Date.parse("2026-10-26T02:00:00Z");
  const pts = parseFirmsCsv(
    `${HEADER}\n-41,-71,h,2026-10-25,2300,1\n-41,-71,h,2026-10-25,0100,1\n-41,-71,h,2026-10-26,0130,1`,
  );
  // 25/10 23:00 and 26/10 01:30 are inside 24 h; 25/10 01:00 is 25 h old.
  expect(withinHours(pts, 24, now).map((p) => p.acqTime)).toEqual([
    "2300",
    "0130",
  ]);
});

test("isReliable excludes low confidence only", () => {
  const [l, n, h] = ["l", "n", "h"].map((c) =>
    isReliable({
      lat: 0,
      lng: 0,
      confidence: c,
      acqDate: "",
      acqTime: "",
      frp: 0,
    }),
  );
  expect([l, n, h]).toEqual([false, true, true]);
});

test("isInArgentina separates Argentina from neighbours", () => {
  expect(isInArgentina(-41.13, -71.31)).toBe(true); // Bariloche
  expect(isInArgentina(-34.6, -58.4)).toBe(true); // Buenos Aires
  expect(isInArgentina(-33.45, -70.67)).toBe(false); // Santiago, Chile
  expect(isInArgentina(-34.9, -56.2)).toBe(false); // Montevideo
  expect(isInArgentina(-25.3, -57.6)).toBe(false); // Asuncion
  expect(isInArgentina(-15.8, -47.9)).toBe(false); // Brasilia
});

test("topByFrp sorts a copy", () => {
  const mk = (frp: number) => ({
    lat: 0,
    lng: 0,
    confidence: "h",
    acqDate: "",
    acqTime: "",
    frp,
  });
  const input = [mk(1), mk(9), mk(5)];
  expect(topByFrp(input, 2).map((p) => p.frp)).toEqual([9, 5]);
  expect(input.map((p) => p.frp)).toEqual([1, 9, 5]);
});

const item = (over: Partial<NewsItem>): NewsItem => ({
  title: "Incendio forestal en Chubut avanza sobre el bosque",
  description: "",
  source: "Diario",
  link: "https://a.com/1",
  image: "https://img/1.jpg",
  publishedAt: "2026-10-25T10:00:00Z",
  ...over,
});

test("isRelevant needs fire + Argentina and rejects foreign stories", () => {
  expect(isRelevant(item({}))).toBe(true);
  expect(
    isRelevant(
      item({
        title: "Delegación argentina visita Castilla-La Mancha por incendios",
      }),
    ),
  ).toBe(false);
  expect(
    isRelevant(
      item({
        title: "La Junta recibe a una delegación de Argentina por incendios",
        description: "Visita en Castilla-La Mancha para conocer su modelo",
      }),
    ),
  ).toBe(false);
  expect(isRelevant(item({ title: "Partido de fútbol en Chubut" }))).toBe(
    false,
  );
});

test("curateNews dedupes by link, near-title and image", () => {
  const out = curateNews([
    item({}),
    item({ link: "https://a.com/1?utm=x" }), // same URL
    item({
      link: "https://b.com/2",
      title: "Incendio forestal en Chubut avanza sobre el bosque hoy",
      image: "https://img/2.jpg",
    }), // near-duplicate title
    item({
      link: "https://c.com/3",
      title: "Brigadistas combaten el fuego en Neuquén",
    }), // new story, repeated image
  ]);
  expect(out.map((n) => n.link)).toEqual([
    "https://a.com/1",
    "https://c.com/3",
  ]);
  expect(out[1].image).toBe("");
});

test("riskLabel thresholds", () => {
  expect(riskLabel({ temperature: 10, humidity: 70, windSpeed: 5 })).toBe(
    "Bajo",
  );
  expect(riskLabel({ temperature: 35, humidity: 10, windSpeed: 50 })).toBe(
    "Extremo",
  );
});
