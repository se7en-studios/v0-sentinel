import { getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// NEXT_PUBLIC_* must be referenced literally so Next inlines them at build time.
const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True when the deployment is configured for per-client Firebase accounts. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

export function fb() {
  const app = getApps()[0] ?? initializeApp(config);
  return { auth: getAuth(app), db: getFirestore(app) };
}
