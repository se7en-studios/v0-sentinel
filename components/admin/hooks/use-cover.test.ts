// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { coverKey, type CoverTarget } from "@/lib/admin/noise";
import { mockFetch } from "./hooks-test-utils";
import { useCover } from "./use-cover";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const target = (lat: number, lng: number): CoverTarget => ({
  key: coverKey(lat, lng),
  lat,
  lng,
});
const A = target(-34.6, -58.4);
const B = target(-41.1, -71.3);

describe("useCover", () => {
  test("marks the cells the batch answers as non-burnable", async () => {
    const f = mockFetch({
      json: { results: [{ burnable: false }, { burnable: true }] },
    });
    const targets = [A, B];
    const { result } = renderHook(() => useCover(undefined, targets));
    await waitFor(() => expect(result.current.has(A.key)).toBe(true));
    expect(result.current.has(B.key)).toBe(false);
    expect(f).toHaveBeenCalledTimes(1);
  });

  test("asks at most 25 cells per refresh", async () => {
    const f = mockFetch({ json: { results: [] } });
    const many = Array.from({ length: 40 }, (_, i) => target(-40 + i * 0.05, -70));
    renderHook(() => useCover(undefined, many));
    await waitFor(() => expect(f).toHaveBeenCalled());
    const body = JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
    expect(body.points).toHaveLength(25);
  });

  test("a failing endpoint leaves the set empty and does not throw", async () => {
    const f = mockFetch({ ok: false, json: {} });
    const targets = [A];
    const { result } = renderHook(() => useCover(undefined, targets));
    await waitFor(() => expect(f).toHaveBeenCalled());
    expect(result.current.size).toBe(0);
  });
});
