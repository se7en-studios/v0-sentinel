import { useCallback, useRef } from "react";
import type { TerrainInfo } from "@/lib/admin/terrain";
import type { CloudSession } from "../use-admin";
import { adminJson } from "@/lib/admin/admin-fetch";

/**
 * Fuel, elevation and slope under a point. Lookups are remembered per ~100 m cell, so
 * reopening a popup or an incident costs nothing; a failed lookup is retried next time.
 */
export function useTerrain(cloud: CloudSession | undefined) {
  const cache = useRef(new Map<string, Promise<TerrainInfo | null>>());
  return useCallback(
    (lat: number, lng: number) => {
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      const hit = cache.current.get(key);
      if (hit) return hit;
      const p = (async () => {
        try {
          return await adminJson<TerrainInfo>(
            `/api/admin/terrain?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}`,
            cloud?.getToken,
            { quiet: true, retry: { retries: 2, baseMs: 1000 } },
          );
        } catch {
          return null;
        }
      })();
      cache.current.set(key, p);
      void p.then((t) => {
        if (!t) cache.current.delete(key);
      });
      return p;
    },
    [cloud],
  );
}
