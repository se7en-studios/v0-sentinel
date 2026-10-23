import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { fbDb } from "./firebase-db";
import { isFeat } from "./store";
import type { BaseLayer, Feat, FirePoint, Meta } from "./types";

export const SHARE_DAYS = 7;
const DAY_MS = 86_400_000;
const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;

/** A frozen picture of the panel. No contacts, thresholds or settings leave the account. */
export interface ShareSnapshot {
  v: 1;
  org: string;
  region: { name: string; center: [number, number]; zoom: number };
  baseLayer: BaseLayer;
  features: Feat[];
  meta: Record<string, Meta>;
  fires: FirePoint[];
  days: string[];
  createdAt: number;
}

export type LoadedShare = ShareSnapshot & { expiresAt: number };

// 24 random bytes -> 32 url-safe chars: not guessable, and the rules forbid listing.
function newToken() {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...b))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function createShare(uid: string, snap: ShareSnapshot) {
  const token = newToken();
  const expiresAt = Date.now() + SHARE_DAYS * DAY_MS;
  await setDoc(doc(fbDb(), "shares", token), {
    owner: uid,
    json: JSON.stringify(snap),
    expiresAt,
  });
  return { token, expiresAt };
}

/** Deletes every link this account created. Returns how many were removed. */
export async function revokeShares(uid: string) {
  const db = fbDb();
  const rows = await getDocs(
    query(collection(db, "shares"), where("owner", "==", uid)),
  );
  await Promise.all(rows.docs.map((d) => deleteDoc(d.ref)));
  return rows.size;
}

const BASE_LAYERS: BaseLayer[] = ["esri", "s2", "viirs", "light", "topo"];
const MAX_FIRES = 50_000;
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

// The snapshot is written by any signed-in account and read by anyone holding the link, so
// the reader trusts nothing in it: wrong shapes would crash the viewer or reach the map code.
function cleanRegion(r: unknown): ShareSnapshot["region"] {
  const x = (r ?? {}) as { name?: unknown; center?: unknown; zoom?: unknown };
  const [lng, lat] = Array.isArray(x.center) ? x.center : [];
  const ok = num(lng) && num(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90;
  return {
    name: typeof x.name === "string" ? x.name.slice(0, 80) : "",
    center: ok ? [lng, lat] : [-64, -38],
    zoom: num(x.zoom) ? Math.min(22, Math.max(0, x.zoom)) : 5,
  };
}

function cleanMeta(m: unknown): Record<string, Meta> {
  if (!m || typeof m !== "object") return {};
  return Object.fromEntries(
    Object.entries(m).flatMap(([id, v]) => {
      const name = (v as { name?: unknown } | null)?.name;
      return typeof name === "string" ? [[id, { name: name.slice(0, 80) }]] : [];
    }),
  );
}

const cleanFires = (f: unknown[]): FirePoint[] =>
  f
    .filter((p): p is FirePoint => Array.isArray(p) && p.length >= 7 && p.slice(0, 7).every(num))
    .slice(0, MAX_FIRES);

/** Public read by token. Returns null when missing, expired or malformed. */
export async function loadShare(token: string): Promise<LoadedShare | null> {
  if (!TOKEN_RE.test(token)) return null;
  const snap = await getDoc(doc(fbDb(), "shares", token));
  const data = snap.data();
  if (
    !data ||
    typeof data.json !== "string" ||
    typeof data.expiresAt !== "number"
  )
    return null;
  if (data.expiresAt < Date.now()) return null;
  const raw = JSON.parse(data.json) as Partial<ShareSnapshot>;
  if (raw.v !== 1 || !Array.isArray(raw.features) || !Array.isArray(raw.fires))
    return null;
  return {
    v: 1,
    org: typeof raw.org === "string" ? raw.org.slice(0, 120) : "",
    region: cleanRegion(raw.region),
    baseLayer: BASE_LAYERS.includes(raw.baseLayer as BaseLayer)
      ? (raw.baseLayer as BaseLayer)
      : "esri",
    features: raw.features.filter(isFeat),
    meta: cleanMeta(raw.meta),
    fires: cleanFires(raw.fires),
    days: Array.isArray(raw.days) ? raw.days.map(String) : [],
    createdAt: Number(raw.createdAt) || 0,
    expiresAt: data.expiresAt,
  };
}
