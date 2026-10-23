import { useEffect, useRef, useState } from "react";
import { COVER_BATCH_MAX, type CoverTarget } from "@/lib/admin/noise";
import type { CloudSession } from "../use-admin";

const EMPTY: ReadonlySet<string> = new Set();
/** a cell that came back empty (tile outage, sea) or a batch that failed waits this long before it is asked again */
const RETRY_MS = 5 * 60_000;

/**
 * Which ~1 km cells are known to be non-vegetated (urban, water, bare ground, snow). Each time `targets`
 * changes it asks the batch endpoint for the first COVER_BATCH_MAX cells that are neither answered, in
 * flight, nor cooling down after a miss, so editing a zone cannot fire duplicate batches and cells that
 * never answer cannot starve the rest. If the lookup fails the set simply stays as it was.
 */
export function useCover(
  cloud: CloudSession | undefined,
  targets: CoverTarget[],
): ReadonlySet<string> {
  const known = useRef(new Map<string, boolean>());
  const inflight = useRef(new Set<string>());
  const retryAt = useRef(new Map<string, number>());
  const [nonBurnable, setNonBurnable] = useState<ReadonlySet<string>>(EMPTY);
  useEffect(() => {
    const now = Date.now();
    const todo = targets
      .filter(
        (t) =>
          !known.current.has(t.key) &&
          !inflight.current.has(t.key) &&
          (retryAt.current.get(t.key) ?? 0) <= now,
      )
      .slice(0, COVER_BATCH_MAX);
    if (!todo.length) return;
    todo.forEach((t) => inflight.current.add(t.key));
    const coolDown = (keys: CoverTarget[]) =>
      keys.forEach((t) => retryAt.current.set(t.key, Date.now() + RETRY_MS));
    void (async () => {
      try {
        const token = cloud ? await cloud.getToken() : null;
        const res = await fetch("/api/admin/terrain/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            points: todo.map(({ lat, lng }) => ({ lat, lng })),
          }),
        });
        const body = res.ok
          ? ((await res.json()) as {
              results?: ({ burnable?: boolean | null } | null)[];
            })
          : null;
        if (!body || !Array.isArray(body.results)) return coolDown(todo);
        const missed: CoverTarget[] = [];
        todo.forEach((t, i) => {
          const r = body.results![i];
          if (r) known.current.set(t.key, r.burnable === false);
          else missed.push(t);
        });
        coolDown(missed);
        setNonBurnable(
          new Set([...known.current].filter(([, v]) => v).map(([k]) => k)),
        );
      } catch {
        coolDown(todo); // degrade: scores stay as the classifier left them
      } finally {
        todo.forEach((t) => inflight.current.delete(t.key));
      }
    })();
  }, [cloud, targets]);
  return nonBurnable;
}
