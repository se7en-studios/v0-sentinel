// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { FirePoint, FiresPayload } from "@/lib/admin/types";
import { mockFetch } from "./hooks-test-utils";
import { useFiresData } from "./use-fires-data";

const NOW = Date.UTC(2026, 9, 22, 15, 0);
const TERRA = 2; // MODIS
const NOAA20 = 0; // VIIRS
// [lat, lng, frp, conf(0-2), dayIdx, hhmm UTC, night, satCode]
const viirs: FirePoint = [-40.1, -71.1, 12, 2, 0, 1400, 0, NOAA20];
const modis: FirePoint = [-41.3, -70.3, 30, 2, 0, 1410, 0, TERRA];
const payload = (points: FirePoint[]): FiresPayload => ({
  updated: new Date(NOW).toISOString(),
  days: ["2026-10-22"],
  points,
  clusters: [],
});
type Opts = Parameters<typeof useFiresData>[1];
const settings = (over: Partial<Opts> = {}): Opts => ({
  refreshMin: 30,
  minConfidence: "l",
  hideNoise: false,
  minScore: 0,
  useModis: true,
  ...over,
});
const render = (s = settings()) =>
  renderHook((p: Opts) => useFiresData(undefined, p), { initialProps: s });
const tick = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useFiresData", () => {
  test("con MODIS prendido muestra todos los focos", async () => {
    mockFetch({ json: payload([viirs, modis]) });
    const { result } = render();
    await tick(0);
    expect(result.current.allFires).toHaveLength(2);
    expect(result.current.stats.total).toBe(2);
  });

  test("con MODIS apagado se filtra de la lista, las cifras y las referencias polares", async () => {
    mockFetch({ json: payload([viirs, modis]) });
    const { result } = render(settings({ useModis: false }));
    await tick(0);
    expect(result.current.allFires).toEqual([viirs]);
    expect(result.current.stats.total).toBe(1);
    expect(result.current.polarRefs).toHaveLength(1);
  });

  test("al apagar MODIS en caliente no hace falta volver a consultar", async () => {
    const f = mockFetch({ json: payload([viirs, modis]) });
    const { result, rerender } = render();
    await tick(0);
    rerender(settings({ useModis: false }));
    expect(result.current.allFires).toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(1);
  });

  test("un fallo no borra los focos ya cargados", async () => {
    mockFetch({ json: payload([viirs]) }, { reject: true });
    const { result } = render(settings({ refreshMin: 5 }));
    await tick(0);
    await tick(5 * 60_000);
    expect(result.current.firesError).toBe("offline");
    expect(result.current.allFires).toHaveLength(1);
    expect(result.current.loading).toBe(false);
  });

  test("un error del servidor se informa y no se carga nada", async () => {
    mockFetch({ ok: false, json: { error: "FIRMS caído" } });
    const { result } = render();
    await tick(0);
    expect(result.current.firesError).toBe("FIRMS caído");
    expect(result.current.payload).toBeNull();
  });

  test("el filtro de confianza descarta los focos de confianza baja", async () => {
    const low: FirePoint = [-39, -70, 5, 0, 0, 1300, 0, NOAA20];
    mockFetch({ json: payload([viirs, low]) });
    const { result } = render(settings({ minConfidence: "n" }));
    await tick(0);
    expect(result.current.allFires).toEqual([viirs]);
  });

  test("consulta cada refreshMin minutos con un mínimo de 5", async () => {
    const f = mockFetch({ json: payload([viirs]) });
    render(settings({ refreshMin: 1 }));
    await tick(0);
    await tick(5 * 60_000);
    expect(f).toHaveBeenCalledTimes(2);
  });
});
