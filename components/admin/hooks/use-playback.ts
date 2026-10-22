import { useEffect, useMemo, useRef, useState } from "react";
import type { FirePoint, FiresPayload } from "@/lib/admin/types";
import { pointTs } from "./fire-time";

/** Time cursor + playback, and the detections visible at that cursor/window. */
export function usePlayback(
  payload: FiresPayload | null,
  allFires: FirePoint[],
  range: { t0: number; t1: number },
  hours: number,
) {
  const [cursor, setCursor] = useState<number | null>(null);
  const cursorRef = useRef(cursor);
  // eslint-disable-next-line react-hooks/refs -- the ref mirrors the cursor synchronously for the playback interval
  cursorRef.current = cursor;
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const fires = useMemo(() => {
    const days = payload?.days ?? [];
    const end = cursor === null ? Infinity : cursor;
    const start =
      // eslint-disable-next-line react-hooks/purity -- window start follows the render-time clock when there is no cursor
      hours >= 240 ? -Infinity : (cursor ?? Date.now()) - hours * 3600_000;
    return allFires.filter((p) => {
      const t = pointTs(days, p);
      return t <= end && t >= start;
    });
  }, [allFires, cursor, hours, payload]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = (cursorRef.current ?? range.t0) + speed * 1.2 * 3600_000;
      if (next >= range.t1) {
        cursorRef.current = null;
        setCursor(null);
        setPlaying(false);
        return;
      }
      cursorRef.current = next;
      setCursor(next);
    }, 100);
    return () => clearInterval(id);
  }, [playing, speed, range]);

  return { cursor, setCursor, playing, setPlaying, speed, setSpeed, fires };
}
