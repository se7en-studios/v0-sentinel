export interface TileErrorTracker {
  /** Registers a failed tile; true exactly once per outage, when the threshold is crossed. */
  fail: (now: number) => boolean;
  /** A tile loaded: the outage is over and the counter restarts. */
  ok: () => void;
}

/** `limit` failures within `windowMs` flag an outage; stays quiet until a success resets it. */
export function createTileErrorTracker(
  limit = 5,
  windowMs = 10_000,
): TileErrorTracker {
  let stamps: number[] = [];
  let notified = false;
  return {
    fail(now) {
      stamps = [...stamps.filter((t) => now - t <= windowMs), now];
      if (notified || stamps.length < limit) return false;
      notified = true;
      return true;
    },
    ok() {
      stamps = [];
      notified = false;
    },
  };
}
