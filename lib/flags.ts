const STORAGE_KEY = "sentinel-flags";
const TRUTHY = new Set(["1", "true", "on", "yes"]);

const asBool = (v: unknown): boolean | null => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return TRUTHY.has(v.trim().toLowerCase());
  return null;
};

function override(name: string): boolean | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    return asBool((o as Record<string, unknown>)[name]);
  } catch {
    return null; // no localStorage (SSR, private mode) or corrupt JSON
  }
}

/**
 * Feature flag. The browser override in localStorage["sentinel-flags"]
 * ({"NAME": true}) wins over the NEXT_PUBLIC_FLAG_<NAME> env var.
 * ponytail: the env lookup is dynamic, so Next does NOT inline it into client
 * bundles (it works on the server and in tests). For a flag needed in the
 * browser, add a static `process.env.NEXT_PUBLIC_FLAG_X` read or use the
 * localStorage override.
 */
export function isEnabled(name: string): boolean {
  const key = name.toUpperCase();
  const local = override(key);
  if (local !== null) return local;
  return asBool(process.env[`NEXT_PUBLIC_FLAG_${key}`]) === true;
}
