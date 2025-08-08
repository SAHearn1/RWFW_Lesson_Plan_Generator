// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

if (!process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
  throw new Error("Missing NEXT_PUBLIC_FIREBASE_CONFIG env var");
}

// parse your one big JSON blob
const firebaseConfig = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG
) as Record<string, any>;

// initialize once, side-effect style
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// only call analytics on the client
const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : undefined;

// re-export just what you need
export { app, auth, analytics, onAuthStateChanged, signInAnonymously };
