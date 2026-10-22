import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fetchForecast } from "./forecast";

// 14 days: 7 past + 7 forecast
const daily = {
  time: Array.from(
    { length: 14 },
    (_, i) => `2026-01-${String(i + 1).padStart(2, "0")}`,
  ),
  temperature_2m_max: Array.from({ length: 14 }, () => 35),
  relative_humidity_2m_min: Array.from({ length: 14 }, () => 15),
  wind_speed_10m_max: Array.from({ length: 14 }, () => 40),
  wind_direction_10m_dominant: Array.from({ length: 14 }, () => 270),
  precipitation_sum: Array.from({ length: 14 }, (_, i) => (i === 3 ? null : 0)),
};
const ok = () =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ daily }) });

let lat = 0;
// each test uses a distinct rounded key so the module-level cache does not leak between them
const nextLat = () => (lat += 3);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("fetchForecast", () => {
  test("maps 7 forecast days with a risk score", async () => {
    vi.stubGlobal("fetch", vi.fn(ok));
    const v = await fetchForecast(nextLat(), 10);
    expect(v).toHaveLength(7);
    expect(v![0]).toMatchObject({
      date: "2026-01-08",
      tmax: 35,
      rhmin: 15,
      windDir: 270,
      rain: 0,
    });
    expect(v![0].score).toBeGreaterThan(55);
    expect(v![0].label).toMatch(/Alto|Extremo/);
  });

  test("caches successes for 30 minutes", async () => {
    const f = vi.fn(ok);
    vi.stubGlobal("fetch", f);
    const la = nextLat();
    await fetchForecast(la, 10);
    vi.advanceTimersByTime(29 * 60_000);
    await fetchForecast(la, 10);
    expect(f).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2 * 60_000);
    await fetchForecast(la, 10);
    expect(f).toHaveBeenCalledTimes(2);
  });

  test("HTTP error returns null and is remembered for one minute", async () => {
    const f = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) }),
    );
    vi.stubGlobal("fetch", f);
    const la = nextLat();
    expect(await fetchForecast(la, 10)).toBeNull();
    vi.advanceTimersByTime(30_000);
    expect(await fetchForecast(la, 10)).toBeNull();
    expect(f).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(40_000);
    expect(await fetchForecast(la, 10)).toBeNull();
    expect(f).toHaveBeenCalledTimes(2);
  });

  test("network error returns null and recovers after the failure window", async () => {
    const f = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockImplementation(ok);
    vi.stubGlobal("fetch", f);
    const la = nextLat();
    expect(await fetchForecast(la, 10)).toBeNull();
    vi.advanceTimersByTime(61_000);
    expect(await fetchForecast(la, 10)).toHaveLength(7);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
