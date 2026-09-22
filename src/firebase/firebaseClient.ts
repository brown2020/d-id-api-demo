import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID,
};

/** True when public Firebase web config is present (false in CI without secrets). */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

const isBrowser = typeof window !== "undefined";

let app: FirebaseApp | undefined;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
let analytics: Analytics | undefined;

if (isFirebaseConfigured) {
  try {
    if (!getApps().length) {
      console.log("Initializing Firebase app...");
      app = initializeApp(firebaseConfig);
      console.log("Firebase initialized with config:", {
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        hasApiKey: !!firebaseConfig.apiKey,
        hasAppId: !!firebaseConfig.appId,
      });
      if (isBrowser) {
        console.log("Current domain:", window.location.hostname);
        console.log("Expected auth domain:", firebaseConfig.authDomain);
      }
    } else {
      console.log("Firebase already initialized");
      app = getApps()[0];
    }
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);

    if (
      isBrowser &&
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_USE_EMULATOR === "true"
    ) {
      console.log("Using Firebase Auth emulator");
      connectAuthEmulator(auth, "http://localhost:9099");
    }

    if (isBrowser) {
      isSupported()
        .then((supported) => {
          if (supported && app) {
            analytics = getAnalytics(app);
          }
        })
        .catch(console.error);
    }
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
} else {
  // CI / SSG without NEXT_PUBLIC_* secrets: skip init so prerender does not throw
  // auth/invalid-api-key. Runtime without config remains unavailable until env is set.
  console.warn(
    "Firebase client config missing; skipping init (expected in CI without secrets)"
  );
  db = {} as Firestore;
  auth = {} as Auth;
  storage = {} as FirebaseStorage;
}

export { db, auth, storage, analytics };
