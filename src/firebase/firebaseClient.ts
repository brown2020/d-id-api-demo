import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID,
};

// Check if we're in the browser environment
const isBrowser = typeof window !== "undefined";

// Initialize Firebase
let app;
try {
  // Check if Firebase app is already initialized
  if (!getApps().length) {
    console.log("Initializing Firebase app...");
    app = initializeApp(firebaseConfig);

    // Log configuration for debugging (without sensitive info)
    console.log("Firebase initialized with config:", {
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey,
      hasAppId: !!firebaseConfig.appId,
    });

    // Only try to access window in browser environment
    if (isBrowser) {
      console.log("Current domain:", window.location.hostname);
      console.log("Expected auth domain:", firebaseConfig.authDomain);
    }
  } else {
    console.log("Firebase already initialized");
    app = getApps()[0];
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Use Auth emulator if in development - only in browser environment
if (
  isBrowser &&
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_EMULATOR === "true"
) {
  console.log("Using Firebase Auth emulator");
  connectAuthEmulator(auth, "http://localhost:9099");
}

let analytics;

// Only initialize analytics in browser environment
if (isBrowser) {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(console.error);
}

export { db, auth, storage, analytics };
