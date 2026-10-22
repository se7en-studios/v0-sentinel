import { useSyncExternalStore } from "react";
import {
  addActivity,
  cleanActivity,
  type ActivityEntry,
  type ActivityKind,
} from "@/lib/admin/activity";

const KEY = "sentinel.activity";
const EMPTY: ActivityEntry[] = [];
let current: ActivityEntry[] | null = null;
const listeners = new Set<() => void>();

function load(): ActivityEntry[] {
  if (current) return current;
  try {
    current = cleanActivity(JSON.parse(sessionStorage.getItem(KEY) ?? "[]"));
  } catch {
    current = [];
  }
  return current;
}

/** Records a notice the panel just raised; survives a page reload within the session. */
export function logActivity(kind: ActivityKind, id: string, title: string, detail: string) {
  const next = addActivity(load(), { id: `${kind}:${id}:${Math.floor(Date.now() / 60_000)}`, t: Date.now(), kind, title, detail });
  if (next === current) return;
  current = next;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked or full: the in-memory list still works
  }
  listeners.forEach((l) => l());
}

export function useActivity(): ActivityEntry[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => void listeners.delete(cb);
    },
    load,
    () => EMPTY,
  );
}
