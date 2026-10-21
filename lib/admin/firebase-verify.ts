import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

/**
 * Verifies a Firebase ID token without the Admin SDK (no service account).
 * Optional ADMIN_ALLOWED_EMAILS (comma separated) restricts who may call the API,
 * which matters if sign-up is not disabled in the Firebase console.
 */
export async function verifyFirebaseToken(token: string): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    if (!payload.sub) return false;
    const allowed = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.length === 0) return process.env.NODE_ENV !== "production";
    return allowed.includes(String(payload.email ?? "").toLowerCase());
  } catch {
    return false;
  }
}
