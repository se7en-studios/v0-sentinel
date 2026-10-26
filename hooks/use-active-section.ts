"use client";

import { useSyncExternalStore } from "react";
import { SECTIONS } from "@/lib/sections";

// Un solo IntersectionObserver compartido por todos los consumidores.
// Banda central del viewport: la sección que la cruza es la activa.
let active: string | null = null;
let observer: IntersectionObserver | null = null;
const tops = new Map<string, number>();
const listeners = new Set<() => void>();

function start() {
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) tops.set(e.target.id, e.boundingClientRect.top);
        else tops.delete(e.target.id);
      }
      let next: string | null = active;
      if (tops.size > 0) {
        next = [...tops.entries()].reduce((a, b) => (a[1] < b[1] ? a : b))[0];
      }
      if (next !== active) {
        active = next;
        listeners.forEach((l) => l());
      }
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );
  for (const s of SECTIONS) {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!observer) start();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      observer?.disconnect();
      observer = null;
      tops.clear();
      active = null;
    }
  };
}

export function useActiveSection(): string | null {
  return useSyncExternalStore(subscribe, () => active, () => null);
}
