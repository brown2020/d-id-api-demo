/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/firebase/firebaseClient";
import { Timestamp, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { create } from "zustand";

interface AuthState {
  uid: string;
  firebaseUid: string;
  authEmail: string;
  authDisplayName: string;
  authPhotoUrl: string;
  authEmailVerified: boolean;
  authReady: boolean;
  authPending: boolean;
  isAdmin: boolean;
  isAllowed: boolean;
  isInvited: boolean;
  lastSignIn: Timestamp | null;
  premium: boolean;
  credits: number;
}

interface AuthActions {
  setAuthDetails: (details: Partial<AuthState>) => void;
  clearAuthDetails: () => void;
}

type AuthStore = AuthState & AuthActions;

const defaultAuthState: AuthState = {
  uid: "",
  firebaseUid: "",
  authEmail: "",
  authDisplayName: "",
  authPhotoUrl: "",
  authEmailVerified: false,
  authReady: false,
  authPending: false,
  isAdmin: false,
  isAllowed: false,
  isInvited: false,
  lastSignIn: null,
  premium: false,
  credits: 0,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...defaultAuthState,

  setAuthDetails: async (details: Partial<AuthState>) => {
    const { ...oldState } = get();
    const newState = { ...oldState, ...details };
    set(newState);
    // Only persist safe, non-privileged fields to Firestore.
    // (Privileged fields like admin flags/credits should be server-managed.)
    const uid = newState.uid;
    await updateUserDetailsInFirestore(details, uid);
  },

  clearAuthDetails: () => set({ ...defaultAuthState }),
}));

async function updateUserDetailsInFirestore(
  details: Partial<AuthState>,
  uid: string
) {
  if (uid) {
    const userRef = doc(db, `users/${uid}`);
    const safeDetails: Partial<AuthState> = {
      firebaseUid: details.firebaseUid,
      authEmail: details.authEmail,
      authDisplayName: details.authDisplayName,
      authPhotoUrl: details.authPhotoUrl,
      authEmailVerified: details.authEmailVerified,
      authReady: details.authReady,
      authPending: details.authPending,
      lastSignIn: details.lastSignIn,
    };

    console.log("Updating auth details in Firestore:", safeDetails);

    // Sanitize details to remove invalid data
    const sanitizedDetails = sanitizeFirestoreData(safeDetails);

    try {
      await setDoc(
        userRef,
        { ...sanitizedDetails, lastSignIn: serverTimestamp() },
        { merge: true }
      );
      console.log("Auth details updated successfully in Firestore.");
    } catch (error) {
      console.error("Error updating auth details in Firestore:", error);
    }
  }
}

// Helper function to sanitize Firestore data
function sanitizeFirestoreData(data: Partial<AuthState>): Record<string, any> {
  const sanitizedData: Record<string, any> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value !== "function" && value !== undefined) {
      sanitizedData[key] = value;
    }
  });

  return sanitizedData;
}
