import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { fb } from "./firebase";
import type { Workspace } from "./types";

// Firestore rejects nested arrays (GeoJSON coordinates are nested), so the
// workspace is stored as one JSON string in workspaces/{uid}.json.
// ponytail: last write wins across devices; add per-element merge if two
// people edit the same account at once.
export async function loadCloud(uid: string): Promise<unknown | null> {
  const snap = await getDoc(doc(fb().db, "workspaces", uid));
  const json = snap.data()?.json;
  return typeof json === "string" ? JSON.parse(json) : null;
}

export async function saveCloud(uid: string, ws: Workspace) {
  await setDoc(doc(fb().db, "workspaces", uid), {
    json: JSON.stringify(ws),
    updatedAt: serverTimestamp(),
  });
}
