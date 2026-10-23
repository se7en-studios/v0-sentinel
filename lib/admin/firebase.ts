import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";

// NEXT_PUBLIC_* must be referenced literally so Next inlines them at build time.
const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True when the deployment is configured for per-client Firebase accounts. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

function app() {
  return getApps()[0] ?? initializeApp(config);
}

/** Auth only: the login screen must not pull Firestore (~100 kB gzip) into its chunk. */
export function fbAuth() {
  return getAuth(app());
}

/** Firestore lives in its own module (firebase-db.ts) so only cloud sync and shares load it. */
export { app as fbApp };
