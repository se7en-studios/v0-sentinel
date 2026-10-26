// SVG pieces of the scroll journey (components/forest-journey.tsx): procedural forest strips with
// irregular conifers and broadleaf trees, a drone, a satellite and a fire. Everything is generated,
// so the scene weighs no image bytes. Shapes are seeded: same forest on every render.

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LAYER_W = 4800;
const LAYER_H = 600;
type Rnd = () => number;
const n1 = (v: number) => Math.round(v * 10) / 10;

/** Conifer with drooping, uneven branch tiers: a jagged silhouette, never two alike. */
function conifer(x: number, h: number, rnd: Rnd) {
  const base = LAYER_H;
  const top = base - h;
  const tiers = Math.max(4, Math.round(h / 38));
  const wMax = h * (0.2 + rnd() * 0.1);
  const lean = (rnd() - 0.5) * h * 0.04;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers;
    const y = top + h * 0.86 * t;
    const half = wMax * Math.pow(t, 0.85);
    const dy = (h * 0.86) / tiers;
    const px = x + lean * t;
    left.push(`${n1(px - half * (0.8 + rnd() * 0.35))} ${n1(y + dy * 0.18)}`, `${n1(px - half * 0.38)} ${n1(y - dy * 0.22)}`);
    right.push(`${n1(px + half * (0.8 + rnd() * 0.35))} ${n1(y + dy * 0.18)}`, `${n1(px + half * 0.38)} ${n1(y - dy * 0.22)}`);
  }
  const trunk = wMax * 0.09;
  const foot = base - h * 0.08;
  right.reverse();
  return (
    `M${n1(x)} ${n1(top)}L${left.join("L")}L${n1(x - trunk)} ${n1(foot)}L${n1(x - trunk)} ${base}` +
    `L${n1(x + trunk)} ${base}L${n1(x + trunk)} ${n1(foot)}L${right.join("L")}Z`
  );
}

/** Broadleaf (lenga/coihue-like): a lumpy canopy of overlapping circles on a trunk. */
function broadleaf(x: number, h: number, rnd: Rnd) {
  const base = LAYER_H;
  const r = h * (0.26 + rnd() * 0.08);
  const cy = base - h + r;
  let d = `M${n1(x - h * 0.02)} ${base}L${n1(x - h * 0.012)} ${n1(cy)}L${n1(x + h * 0.012)} ${n1(cy)}L${n1(x + h * 0.02)} ${base}Z`;
  const blobs = 5 + Math.floor(rnd() * 3);
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2;
    const rr = r * (0.55 + rnd() * 0.3);
    const bx = x + Math.cos(a) * r * 0.62;
    const by = cy + Math.sin(a) * r * 0.5;
    d += `M${n1(bx - rr)} ${n1(by)}a${n1(rr)} ${n1(rr)} 0 1 0 ${n1(rr * 2)} 0a${n1(rr)} ${n1(rr)} 0 1 0 -${n1(rr * 2)} 0Z`;
  }
  return d;
}

function forestPath(seed: number, count: number, min: number, max: number, broadShare: number) {
  const rnd = mulberry32(seed);
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = (i + rnd() * 0.9) * (LAYER_W / count);
    const h = min + rnd() * (max - min);
    d += rnd() < broadShare ? broadleaf(x, h * 0.8, rnd) : conifer(x, h, rnd);
  }
  return d;
}

function ridgePath(seed: number, base: number, amp: number) {
  const rnd = mulberry32(seed);
  const step = 120;
  let d = `M0 ${LAYER_H}V${base}`;
  let y = base;
  for (let x = step; x <= LAYER_W + step; x += step) {
    y = Math.min(base, Math.max(base - amp, y + (rnd() - 0.52) * amp * 0.9));
    d += `L${x} ${n1(y)}`;
  }
  return d + `V${LAYER_H}Z`;
}

/** Foreground undergrowth: thin curved blades, swayed as a whole by CSS. */
function grassPath(seed: number, count: number, min: number, max: number) {
  const rnd = mulberry32(seed);
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = rnd() * LAYER_W;
    const h = min + rnd() * (max - min);
    const bend = (rnd() - 0.5) * h * 0.5;
    d += `M${n1(x - 3)} ${LAYER_H}Q${n1(x + bend * 0.3)} ${n1(LAYER_H - h * 0.6)} ${n1(x + bend)} ${n1(LAYER_H - h)}Q${n1(x + bend * 0.3 + 4)} ${n1(LAYER_H - h * 0.55)} ${n1(x + 3)} ${LAYER_H}Z`;
  }
  return d;
}

export type LayerKind = "ridge" | "far" | "mid" | "near" | "grass";

const LAYERS: Record<LayerKind, { d: string; top: string; bottom: string; blur: number }> = {
  ridge: { d: ridgePath(7, 340, 200), top: "#86ad9b", bottom: "#c9d8cd", blur: 1.4 },
  far: { d: forestPath(11, 120, 80, 170, 0.3), top: "#5d8a76", bottom: "#a9c4b6", blur: 0.9 },
  mid: { d: forestPath(23, 60, 150, 290, 0.2), top: "#1d4838", bottom: "#4c7a66", blur: 0.3 },
  near: { d: forestPath(41, 15, 330, 560, 0.05), top: "#061a12", bottom: "#123424", blur: 0 },
  grass: { d: grassPath(5, 260, 40, 150), top: "#040f0a", bottom: "#0b261a", blur: 0 },
};

/** One parallax strip. Height comes from the parent; width follows the 8:1 aspect. */
export function ForestLayer({ kind, sway = false }: { kind: LayerKind; sway?: boolean }) {
  const { d, top, bottom, blur } = LAYERS[kind];
  const id = `jn-g-${kind}`;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${LAYER_W} ${LAYER_H}`}
      preserveAspectRatio="xMinYMax meet"
      className="block h-full w-auto max-w-none"
      style={{ aspectRatio: `${LAYER_W} / ${LAYER_H}` }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
        {blur > 0 && (
          <filter id={`${id}-b`} x="-1%" y="-1%" width="102%" height="102%">
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        )}
      </defs>
      <path
        className={sway ? "jn-sway" : undefined}
        d={d}
        fill={`url(#${id})`}
        filter={blur > 0 ? `url(#${id}-b)` : undefined}
      />
    </svg>
  );
}

/** Quadcopter seen from the front: shaded shell, motors, blurred rotors, gimbal camera, nav lights. */
export function Drone({ scan = true }: { scan?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 160 260" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="jn-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6f68" />
          <stop offset="0.5" stopColor="#26362f" />
          <stop offset="1" stopColor="#0d1713" />
        </linearGradient>
        <radialGradient id="jn-lens" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#9fe8ff" />
          <stop offset="0.4" stopColor="#1b4256" />
          <stop offset="1" stopColor="#050b0e" />
        </radialGradient>
        <linearGradient id="jn-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8ffe1" stopOpacity="0.5" />
          <stop offset="1" stopColor="#94f1be" stopOpacity="0" />
        </linearGradient>
        <filter id="jn-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      {scan && <path className="jn-scan" d="M72 66L6 262H154L88 66Z" fill="url(#jn-cone)" filter="url(#jn-soft)" />}
      {/* rear arms, slightly lost in the shade */}
      <path d="M80 40L34 24M80 40L126 24" stroke="#0b1511" strokeWidth="3" opacity="0.55" fill="none" />
      <path d="M80 42L20 34M80 42L140 34" stroke="#18261f" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      {[20, 140].map((x) => (
        <g key={x}>
          <rect x={x - 5} y="26" width="10" height="11" rx="3" fill="url(#jn-shell)" stroke="#9fe8c8" strokeOpacity="0.25" strokeWidth="0.8" />
          <ellipse className="jn-rotor" cx={x} cy="22" rx="27" ry="3.4" fill="#d9fff0" fillOpacity="0.28" />
          <ellipse cx={x} cy="22" rx="27" ry="1.2" fill="#0b1511" fillOpacity="0.55" />
        </g>
      ))}
      {/* landing skids */}
      <path d="M58 62L50 76H110L102 62M50 76H110" stroke="#0b1511" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* body */}
      <path d="M54 44C54 32 66 30 80 30S106 32 106 44V54C106 62 98 66 80 66S54 62 54 54Z" fill="url(#jn-shell)" stroke="#9fe8c8" strokeOpacity="0.35" strokeWidth="0.9" />
      <path d="M62 36C70 32 90 32 98 36" stroke="#cdeee0" strokeOpacity="0.4" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* gimbal camera */}
      <rect x="74" y="64" width="12" height="6" rx="2" fill="#0b1511" />
      <circle cx="80" cy="76" r="8" fill="#0b1511" stroke="#9fe8c8" strokeOpacity="0.3" strokeWidth="0.8" />
      <circle cx="80" cy="76" r="5" fill="url(#jn-lens)" />
      <circle className="jn-led" cx="63" cy="52" r="2.4" fill="#ff4d3d" />
      <circle className="jn-led jn-led-b" cx="97" cy="52" r="2.4" fill="#5dffa6" />
      <circle cx="80" cy="45" r="1.4" fill="#fff" opacity="0.8" />
    </svg>
  );
}

export function Satellite() {
  return (
    <svg aria-hidden viewBox="0 0 120 60" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="jn-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#274a73" />
          <stop offset="1" stopColor="#0d1d33" />
        </linearGradient>
      </defs>
      <rect x="4" y="22" width="38" height="16" rx="1" fill="url(#jn-panel)" stroke="#c9dcff" strokeOpacity="0.5" strokeWidth="0.8" />
      <rect x="78" y="22" width="38" height="16" rx="1" fill="url(#jn-panel)" stroke="#c9dcff" strokeOpacity="0.5" strokeWidth="0.8" />
      <path d="M13 22v16M22 22v16M31 22v16M87 22v16M96 22v16M105 22v16" stroke="#c9dcff" strokeOpacity="0.28" />
      <path d="M42 30H46M74 30H78" stroke="#8a97a5" strokeWidth="2" />
      <rect x="46" y="18" width="28" height="24" rx="3" fill="#c7ccd2" stroke="#ffffff" strokeOpacity="0.6" />
      <rect x="46" y="18" width="28" height="9" rx="3" fill="#e8c24a" opacity="0.85" />
      <circle className="jn-led" cx="60" cy="34" r="2.2" fill="#94f1be" />
    </svg>
  );
}

/** One flame: three layers distorted by animated turbulence, so it licks instead of just scaling. */
export function Flame({ animate = true, id = "a" }: { animate?: boolean; id?: string }) {
  const f = `jn-turb-${id}`;
  return (
    <svg aria-hidden viewBox="0 0 120 150" className={`h-full w-full overflow-visible ${animate ? "jn-flame" : ""}`}>
      <defs>
        <filter id={f} x="-30%" y="-20%" width="160%" height="150%">
          {/* ponytail: turbulencia estática; animar baseFrequency re-filtraba la llama en cada frame. El parpadeo es un transform CSS (jn-flame). */}
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.045" numOctaves="2" seed={id.charCodeAt(0)} />
          <feDisplacementMap in="SourceGraphic" scale="16" />
        </filter>
        <linearGradient id={`${f}-o`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffb02e" />
          <stop offset="0.55" stopColor="#ff6a1a" />
          <stop offset="1" stopColor="#c8321e" />
        </linearGradient>
      </defs>
      <g filter={`url(#${f})`}>
        <path d="M60 4C72 36 100 56 94 98C90 128 72 146 60 146C48 146 30 128 26 98C22 64 50 44 60 4Z" fill={`url(#${f}-o)`} />
        <path d="M60 40C68 62 84 76 81 102C79 122 69 136 60 136C51 136 41 122 39 102C36 80 53 64 60 40Z" fill="#ffc24a" />
        <path d="M60 80C65 92 70 100 68 112C67 122 63 130 60 130C57 130 53 122 52 112C50 100 55 92 60 80Z" fill="#fff4c4" />
      </g>
    </svg>
  );
}
