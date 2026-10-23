import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { fbDb } from "./firebase-db";
import { reportAuthExpired } from "./connection";
import type { Workspace } from "./types";

// Firestore rejects nested arrays (GeoJSON coordinates are nested), so the
// workspace is stored as one JSON string in workspaces/{uid}.json.
// `rev` counts successful saves; a save only lands if nobody else bumped it
// since this client last read it, so two devices can no longer overwrite each
// other silently. ponytail: whole-document conflict (keep mine / take server);
// per-element merge is the upgrade if two people edit one account at once.
export interface CloudCopy {
  data: unknown;
  rev: number;
  /** ms epoch of the edit that produced this copy */
  clientAt: number;
}

export class ConflictError extends Error {}

const MAX_JSON = 850_000;

/** Firestore says the session is gone: flag it so the banner offers to sign in again (the local copy is untouched). */
function flagAuth(e: unknown): never {
  const code = (e as { code?: unknown } | null)?.code;
  if (code === "unauthenticated" || code === "permission-denied") reportAuthExpired();
  throw e;
}

export async function loadCloud(uid: string): Promise<CloudCopy | null> {
  const snap = await getDoc(doc(fbDb(), "workspaces", uid)).catch(flagAuth);
  const d = snap.data();
  if (typeof d?.json !== "string") return null;
  return {
    data: JSON.parse(d.json),
    rev: Number(d.rev) || 0,
    clientAt: Number(d.clientAt) || 0,
  };
}

/** Returns the new revision. Throws ConflictError when the server moved on. */
export async function saveCloud(
  uid: string,
  ws: Workspace,
  baseRev: number,
  clientAt: number,
  force = false,
): Promise<number> {
  const db = fbDb();
  const ref = doc(db, "workspaces", uid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = Number(snap.data()?.rev) || 0;
    if (!force && snap.exists() && current !== baseRev)
      throw new ConflictError();
    const json = JSON.stringify(ws);
    // firestore.rules reject json over 900000 bytes: fail loudly here instead of retrying a write that can never land
    if (json.length > MAX_JSON) throw new Error("El espacio de trabajo es demasiado grande para guardarse en la nube");
    const rev = current + 1;
    tx.set(ref, {
      json,
      rev,
      clientAt,
      updatedAt: serverTimestamp(),
    });
    return rev;
  }).catch(flagAuth);
}
