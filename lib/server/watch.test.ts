import { describe, expect, test } from "vitest";
import type { FireRow } from "@/lib/admin/fires-parse";
import {
  cronAuthorized,
  exposedFires,
  watchConfig,
  watchMessage,
} from "./watch";

const NOW = Date.UTC(2026, 10, 21, 18, 0);
const HOUR = 3_600_000;
const row = (
  lat: number,
  lng: number,
  agoH: number,
  conf: 0 | 1 | 2 = 1,
): FireRow => ({
  lat,
  lng,
  date: "2026-11-21",
  time: 1500,
  at: NOW - agoH * HOUR,
  frp: 12,
  conf,
  night: false,
});
const TOWN = { lat: -41.13, lng: -71.3 };
const people = (lat: number) =>
  lat > -42 ? { km5: 5000, km10: 20000 } : { km5: 0, km10: 10 };
const cfg = watchConfig({});

describe("exposedFires", () => {
  test("keeps a fresh fire next to a town, even a single detection", () => {
    const out = exposedFires([row(TOWN.lat, TOWN.lng, 1)], NOW, cfg, people);
    expect(out).toHaveLength(1);
    expect(out[0].people.km5).toBe(5000);
  });

  test("drops old, low-confidence and empty-land detections", () => {
    const rows = [
      row(TOWN.lat, TOWN.lng, 5), // older than the 3 h window
      row(TOWN.lat, TOWN.lng, 1, 0), // low confidence
      row(-45, -69, 1), // nobody around
    ];
    expect(exposedFires(rows, NOW, cfg, people)).toEqual([]);
  });

  test("a city roof or a fixed industrial source is not a wildfire", () => {
    const urban = exposedFires([row(TOWN.lat, TOWN.lng, 1)], NOW, cfg, people, () => "urbano");
    expect(urban).toEqual([]);
    // the same pixel every day for five days with modest power: a flare or a kiln
    const fixed = Array.from({ length: 6 }, (_, d) => ({
      ...row(TOWN.lat, TOWN.lng, 1 + d * 24),
      date: `2026-11-${21 - d}`,
    }));
    expect(exposedFires(fixed, NOW, { ...cfg, windowMs: 2 * HOUR }, people)).toEqual([]);
    expect(exposedFires([row(TOWN.lat, TOWN.lng, 1)], NOW, cfg, people, () => "bosque")).toHaveLength(1);
    // wetland sits in the "otro" group: Delta island fires must still be announced
    expect(exposedFires([row(TOWN.lat, TOWN.lng, 1)], NOW, cfg, people, () => "otro")).toHaveLength(1);
  });

  test("a missing population grid announces nothing instead of failing", () => {
    expect(
      exposedFires([row(TOWN.lat, TOWN.lng, 1)], NOW, cfg, () => null),
    ).toEqual([]);
  });
});

describe("watchConfig", () => {
  test("defaults and env overrides, ignoring junk", () => {
    expect(cfg).toEqual({ windowMs: 3 * HOUR, minPeople: 1000 });
    expect(
      watchConfig({ WATCH_WINDOW_MIN: "60", WATCH_MIN_PEOPLE: "x" }),
    ).toEqual({
      windowMs: HOUR,
      minPeople: 1000,
    });
  });
});

describe("watchMessage", () => {
  test("names the place, the people and fits the notify limits", () => {
    const fire = exposedFires(
      [row(TOWN.lat, TOWN.lng, 1)],
      NOW,
      cfg,
      people,
    )[0];
    const many = Array.from({ length: 9 }, () => fire);
    const { title, message } = watchMessage(many);
    expect(title).toContain("9 focos");
    expect(title.length).toBeLessThanOrEqual(120);
    expect(message).toContain("5.000 personas a 5 km");
    expect(message).toContain("y 4 más");
    expect(message.length).toBeLessThanOrEqual(1000);
    expect(watchMessage([fire]).title).toContain("foco nuevo");
  });
});

describe("cronAuthorized", () => {
  test("only the exact bearer secret passes", () => {
    expect(cronAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(cronAuthorized("Bearer s3cre", "s3cret")).toBe(false);
    expect(cronAuthorized("s3cret", "s3cret")).toBe(false);
    expect(cronAuthorized(null, "s3cret")).toBe(false);
    expect(cronAuthorized("Bearer ", undefined)).toBe(false);
  });
});
