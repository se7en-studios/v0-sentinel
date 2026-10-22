import { useCallback, useRef } from "react";
import type { TerrainInfo } from "@/lib/admin/terrain";
import type { CloudSession } from "../use-admin";

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
          const token = cloud ? await cloud.getToken() : null;
          const res = await fetch(
            `/api/admin/terrain?lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}`,
            token
              ? { headers: { Authorization: `Bearer ${token}` } }
              : undefined,
          );
          return res.ok ? ((await res.json()) as TerrainInfo) : null;
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
