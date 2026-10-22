// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { mockFetch } from "./hooks-test-utils";
import { useTerrain } from "./use-terrain";

const info = { fuel: "Pastizal", elevation: 812, slope: 4, aspect: 180 };
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useTerrain", () => {
  test("recuerda la consulta por celda de ~100 m", async () => {
    const f = mockFetch({ json: info });
    const { result } = renderHook(() => useTerrain(undefined));
    const a = await result.current(-40.12345, -71.12345);
    const b = await result.current(-40.12349, -71.12341);
    expect(a).toEqual(info);
    expect(b).toEqual(info);
    expect(f).toHaveBeenCalledTimes(1);
  });

  test("una consulta fallida devuelve null y se reintenta la próxima vez", async () => {
    const f = mockFetch({ ok: false, json: {} }, { json: info });
    const { result } = renderHook(() => useTerrain(undefined));
    expect(await result.current(-40, -71)).toBeNull();
    await Promise.resolve();
    expect(await result.current(-40, -71)).toEqual(info);
    expect(f).toHaveBeenCalledTimes(2);
  });

  test("un error de red también devuelve null sin lanzar", async () => {
    mockFetch({ reject: true });
    const { result } = renderHook(() => useTerrain(undefined));
    expect(await result.current(-40, -71)).toBeNull();
  });

  test("con sesión en la nube manda el token", async () => {
    const f = mockFetch({ json: info });
    const cloud = { getToken: async () => "tok" } as never;
    const { result } = renderHook(() => useTerrain(cloud));
    await result.current(-40, -71);
    const init = f.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual({ Authorization: "Bearer tok" });
  });
});
