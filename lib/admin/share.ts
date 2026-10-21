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
import { fb } from "./firebase";
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
  await setDoc(doc(fb().db, "shares", token), {
    owner: uid,
    json: JSON.stringify(snap),
    expiresAt,
  });
  return { token, expiresAt };
}

/** Deletes every link this account created. Returns how many were removed. */
export async function revokeShares(uid: string) {
  const { db } = fb();
  const rows = await getDocs(
    query(collection(db, "shares"), where("owner", "==", uid)),
  );
  await Promise.all(rows.docs.map((d) => deleteDoc(d.ref)));
  return rows.size;
}

/** Public read by token. Returns null when missing, expired or malformed. */
export async function loadShare(token: string): Promise<LoadedShare | null> {
  if (!TOKEN_RE.test(token)) return null;
  const snap = await getDoc(doc(fb().db, "shares", token));
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
    org: String(raw.org ?? ""),
    region: raw.region ?? { name: "", center: [-64, -38], zoom: 5 },
    baseLayer: raw.baseLayer ?? "esri",
    features: raw.features.filter(isFeat),
    meta: raw.meta ?? {},
    fires: raw.fires,
    days: Array.isArray(raw.days) ? raw.days.map(String) : [],
    createdAt: Number(raw.createdAt) || 0,
    expiresAt: data.expiresAt,
  };
}
