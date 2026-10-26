// What was already sent, kept in this browser so the limits survive a reload. Client only.
// Two browsers open at once each keep their own record, so the limits are per browser (documented in docs/INTEGRACIONES.md).

import { useSyncExternalStore } from "react";
import {
  EMPTY_DELIVERY,
  cleanDelivery,
  type DeliveryState,
} from "./alert-delivery";

const KEY = "sentinel-admin-delivery-v1";
const listeners = new Set<() => void>();

// useSyncExternalStore needs a stable snapshot: it is rebuilt only when the stored text changes
let cachedRaw: string | null | undefined;
let cached: DeliveryState = EMPTY_DELIVERY;

function read(): DeliveryState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* private mode: nothing is remembered, the limits then hold only until reload */
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    cached = raw ? cleanDelivery(JSON.parse(raw), Date.now()) : EMPTY_DELIVERY;
  } catch {
    cached = EMPTY_DELIVERY;
  }
  return cached;
}

export const loadDelivery = (): DeliveryState => read();

export function saveDelivery(next: DeliveryState): void {
  const raw = JSON.stringify(next);
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    /* private mode */
  }
  // keep the snapshot right even when storage refused the write
  cachedRaw = raw;
  cached = next;
  listeners.forEach((l) => l());
}

export function useDeliveryState(): DeliveryState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => e.key === KEY && cb();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    read,
    () => EMPTY_DELIVERY,
  );
}
