import { isAuthed } from "@/lib/admin/auth";
import { firebaseEnabled } from "@/lib/admin/firebase";
import { verifyFirebaseToken } from "@/lib/admin/firebase-verify";

/** Admin API access: a verified Firebase token when Firebase is on, otherwise the session cookie. */
export async function allowed(req: Request) {
  if (firebaseEnabled) {
    const token =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    return token ? verifyFirebaseToken(token) : false;
  }
  return isAuthed();
}
