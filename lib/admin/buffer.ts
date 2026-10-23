// @turf/buffer drags in jsts (~450 kB of source). Only zone buffers and patrol rings need it,
// so it loads on demand instead of sitting in the first-paint bundle.
type Buffer = typeof import("@turf/buffer").default;

let impl: Buffer | null = null;
let loading: Promise<Buffer> | null = null;

export function loadBuffer(): Promise<Buffer> {
  loading ??= import("@turf/buffer").then((m) => (impl = m.default));
  return loading;
}

/** The loaded buffer function, or null until loadBuffer() has resolved. */
export const getBuffer = () => impl;
