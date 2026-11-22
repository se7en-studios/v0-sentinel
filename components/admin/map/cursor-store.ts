import { useSyncExternalStore } from "react";

// The pointer position over the map. It used to live in AdminApp's state, so every mouse move
// (up to ~8 a second) re-rendered the whole admin tree just to update one line of coordinates.
// Only the readout subscribes now.

type Pos = [number, number] | null;
let pos: Pos = null;
const listeners = new Set<() => void>();

export function setCursor(p: Pos): void {
  if (p === pos || (p && pos && p[0] === pos[0] && p[1] === pos[1])) return;
  pos = p;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useCursor = (): Pos =>
  useSyncExternalStore(
    subscribe,
    () => pos,
    () => null,
  );

// Same for the map camera: only the compass, the zoom readout and the edge ruler read it, and it
// changes on every frame of a pan or a rotation.
export interface Camera {
  bearing: number;
  pitch: number;
  zoom: number;
}
let cam: Camera = { bearing: 0, pitch: 0, zoom: 8 };
const camListeners = new Set<() => void>();

export function setCamera(c: Camera): void {
  if (c.bearing === cam.bearing && c.pitch === cam.pitch && c.zoom === cam.zoom) return;
  cam = c;
  camListeners.forEach((l) => l());
}

const subscribeCam = (l: () => void) => {
  camListeners.add(l);
  return () => {
    camListeners.delete(l);
  };
};

export const useCamera = (): Camera => useSyncExternalStore(subscribeCam, () => cam, () => cam);
