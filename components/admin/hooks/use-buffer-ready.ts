import { useEffect, useState } from "react";
import { getBuffer, loadBuffer } from "@/lib/admin/buffer";

/** True once the lazy @turf/buffer chunk is loaded; `needed` false skips the download. */
export function useBufferReady(needed: boolean) {
  const [ready, setReady] = useState(() => getBuffer() !== null);
  useEffect(() => {
    if (!needed || ready) return;
    let live = true;
    loadBuffer().then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, [needed, ready]);
  return ready || !needed;
}
