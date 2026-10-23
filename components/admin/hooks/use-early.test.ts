// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { EarlyPayload, Feat } from "@/lib/admin/types";
import { mockFetch, setHidden } from "./hooks-test-utils";
import { useEarly } from "./use-early";

const FIVE_MIN = 5 * 60_000;
const payload = (n: number): EarlyPayload => ({
  updated: "2026-10-22T12:00:00Z",
  fetchedAt: n,
  early: [],
  sources: [],
});
const tick = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
const render = (enabled = true) =>
  renderHook(() => useEarly(undefined, enabled, [], [], 5, 0));

beforeEach(() => {
  vi.useFakeTimers();
  setHidden(false);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useEarly", () => {
  test("no consulta nada si las alertas tempranas están apagadas", async () => {
    const f = mockFetch({ json: payload(1) });
    render(false);
    await tick(FIVE_MIN * 2);
    expect(f).not.toHaveBeenCalled();
  });

  test("carga al montar y vuelve a consultar cada 5 minutos", async () => {
    const f = mockFetch({ json: payload(1) }, { json: payload(2) });
    const { result } = render();
    await tick(0);
    expect(result.current.earlyPayload?.fetchedAt).toBe(1);
    await tick(FIVE_MIN);
    expect(f).toHaveBeenCalledTimes(2);
    expect(result.current.earlyPayload?.fetchedAt).toBe(2);
  });

  test("con la pestaña oculta el sondeo se pausa y retoma al volver", async () => {
    const f = mockFetch({ json: payload(1) });
    render();
    await tick(0);
    setHidden(true);
    await tick(FIVE_MIN * 3);
    expect(f).toHaveBeenCalledTimes(1);
    setHidden(false);
    await tick(FIVE_MIN);
    expect(f).toHaveBeenCalledTimes(2);
  });

  test("un fallo conserva los datos anteriores y expone el error", async () => {
    mockFetch({ json: payload(1) }, { reject: true });
    const { result } = render();
    await tick(0);
    await tick(FIVE_MIN);
    await tick(30_000); // the retries with backoff run out
    expect(result.current.earlyPayload?.fetchedAt).toBe(1);
    expect(result.current.earlyError).toBe("offline");
  });

  test("tras un fallo reintenta solo y se recupera sin esperar al próximo ciclo", async () => {
    mockFetch({ json: payload(1) }, { reject: true }, { reject: true }, { json: payload(2) });
    const { result } = render();
    await tick(0);
    await tick(FIVE_MIN);
    await tick(30_000);
    expect(result.current.earlyPayload?.fetchedAt).toBe(2);
    expect(result.current.earlyError).toBeNull();
  });

  test("una respuesta con error HTTP usa el mensaje del servidor", async () => {
    mockFetch({ ok: false, json: { error: "sin servicio" } });
    const { result } = render();
    await tick(0);
    expect(result.current.earlyError).toBe("sin servicio");
    expect(result.current.earlyPayload).toBeNull();
  });

  test("una respuesta lenta y vieja no pisa a la más nueva", async () => {
    let release!: () => void;
    const slow = new Promise<void>((r) => (release = r));
    let n = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const mine = ++n;
        if (mine === 1) await slow;
        return { ok: true, json: async () => payload(mine) } as Response;
      }),
    );
    const { result } = render();
    await act(async () => {
      await result.current.refreshEarly();
    });
    release();
    await tick(0);
    expect(result.current.earlyPayload?.fetchedAt).toBe(2);
  });

  describe("alertas abiertas por zona", () => {
    const NOW = Date.UTC(2026, 9, 22, 15, 0);
    const step = Math.floor(NOW / 600_000);
    const zone: Feat = {
      id: "z1",
      type: "Feature",
      properties: { mode: "zone-polygon" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-71, -41],
            [-71, -40],
            [-70, -40],
            [-70, -41],
            [-71, -41],
          ],
        ],
      },
    };
    const spot = (lat: number, lng: number, lastAt: number) => ({
      lat,
      lng,
      frp: 20,
      scans: 5,
      firstAt: lastAt - 30 * 60_000,
      lastAt,
      sources: ["FIRMS" as const],
    });
    const run = (early: unknown[], polar: never[] = []) => {
      mockFetch({ json: { ...payload(1), early } });
      return renderHook(() => useEarly(undefined, true, polar, [zone], 5, step));
    };

    test("una alerta abierta dentro de la zona se asigna a ella", async () => {
      const { result } = run([spot(-40.5, -70.5, NOW - 10 * 60_000)]);
      await tick(0);
      expect(result.current.earlyOpen).toHaveLength(1);
      expect(result.current.earlyByZone.z1).toHaveLength(1);
    });

    test("una alerta que el satélite ya no ve hace más de 90 min deja de ser noticia", async () => {
      const { result } = run([spot(-40.5, -70.5, NOW - 120 * 60_000)]);
      await tick(0);
      expect(result.current.early).toHaveLength(1);
      expect(result.current.earlyOpen).toHaveLength(0);
      expect(result.current.earlyByZone).toEqual({});
    });

    test("una alerta lejos de la zona no se asigna", async () => {
      const { result } = run([spot(-30, -60, NOW - 10 * 60_000)]);
      await tick(0);
      expect(result.current.earlyOpen).toHaveLength(1);
      expect(result.current.earlyByZone).toEqual({});
    });
  });
});
