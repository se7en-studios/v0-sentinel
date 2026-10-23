import { useSyncExternalStore } from "react";

// Tiny module store so the palette, the shortcuts help, the tour and the onboarding card can open
// the guide without threading state through admin-app/use-admin.
const SEEN_KEY = "sentinel-admin-guide-seen";
const listeners = new Set<() => void>();
let open = false;

const emit = () => listeners.forEach((l) => l());

export function setGuideOpen(v: boolean) {
  if (open === v) return;
  open = v;
  if (v) {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode: it just will not be remembered */
    }
  }
  emit();
}

export const openGuide = () => setGuideOpen(true);

export function useGuideOpen(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => open,
    () => false,
  );
}

/** True once the guide was opened on this device (only used to stop nudging). */
export function guideSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
