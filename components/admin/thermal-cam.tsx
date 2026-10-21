"use client";

import { useEffect, useRef } from "react";
import { hash } from "@/lib/admin/sim";

const W = 128;
const H = 80;

// Inferno-like palette stops (value 0..1 -> rgb).
const STOPS: [number, number, number][] = [
  [8, 6, 28],
  [58, 14, 98],
  [140, 36, 100],
  [214, 74, 52],
  [248, 150, 26],
  [252, 232, 110],
  [255, 255, 235],
];

function palette(v: number): [number, number, number] {
  const x = Math.min(0.9999, Math.max(0, v)) * (STOPS.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  return [
    a[0] + (b[0] - a[0]) * f,
    a[1] + (b[1] - a[1]) * f,
    a[2] + (b[2] - a[2]) * f,
  ];
}

// Integer lattice hash: fast enough to run ~10k times per frame.
function ihash(x: number, y: number, s: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
function noise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const g = (a: number, b: number) => ihash(a, b, seed);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const top = g(xi, yi) * (1 - fx) + g(xi + 1, yi) * fx;
  const bot = g(xi, yi + 1) * (1 - fx) + g(xi + 1, yi + 1) * fx;
  return top * (1 - fy) + bot * fy;
}

/** Procedural thermal feed. SIMULATED: there is no real camera behind it. */
export function ThermalCam({ seed, hot }: { seed: string; hot: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const s = Math.floor(hash(seed) * 1000);
    const img = ctx.createImageData(W, H);
    let raf = 0;
    let last = 0;
    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (ts - last < 90) return;
      last = ts;
      const t = ts / 1000;
      const hx = W * (0.5 + 0.25 * Math.sin(t / 3.1 + s));
      const hy = H * (0.55 + 0.18 * Math.cos(t / 2.3 + s));
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let v =
            0.42 * noise(x / 9 + t * 0.6, y / 9, s) +
            0.28 * noise(x / 4 - t * 0.3, y / 4 + t * 0.2, s + 7) +
            0.12;
          // tree-line stripes make it read as canopy
          v += 0.1 * Math.sin(x * 0.7 + noise(x / 6, y / 6, s) * 6);
          if (hot) {
            const d = Math.hypot(x - hx, (y - hy) * 1.3);
            v +=
              0.75 * Math.exp(-(d * d) / 120) * (0.8 + 0.2 * Math.sin(t * 7));
          }
          const [r, g, b] = palette(v);
          const k = (y * W + x) * 4;
          img.data[k] = r;
          img.data[k + 1] = g;
          img.data[k + 2] = b;
          img.data[k + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [seed, hot]);

  return (
    <div className="relative aspect-[8/5] w-full overflow-hidden rounded-md bg-black">
      <canvas
        ref={ref}
        width={W}
        height={H}
        className="h-full w-full [image-rendering:auto]"
        aria-label="Cámara térmica simulada"
        role="img"
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 border border-[#4bc182]/80" />
        <div className="absolute left-1/2 top-1/2 h-px w-12 -translate-x-1/2 bg-[#4bc182]/60" />
        <div className="absolute left-1/2 top-1/2 h-12 w-px -translate-y-1/2 bg-[#4bc182]/60" />
      </div>
    </div>
  );
}
