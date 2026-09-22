"use client";

import { auth, isFirebaseConfigured } from "../firebase/firebaseClient";
import { useAuthStore } from "../zustand/useAuthStore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState , useMemo} from "react";
import { Timestamp, serverTimestamp } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { isProtectedPathname } from "@/libs/auth-constants";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function FirebaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);
  const clearAuthDetails = useAuthStore((state) => state.clearAuthDetails);
  const router = useRouter();
  const pathname = usePathname();
  const isProtectedRoute = isProtectedPathname(pathname);

  useEffect(() => {
    // Safety check - only run in browser
    if (typeof window === "undefined") {
      return;
    }

    if (!isFirebaseConfigured) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    // Initialize the auth subscription
    let unsubscribe: () => void;

    try {
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);

        if (currentUser) {
          // User is signed in
          setAuthDetails({
            uid: currentUser.uid,
            firebaseUid: currentUser.uid,
            authEmail: currentUser.email || "",
            authDisplayName: currentUser.displayName || "",
            authPhotoUrl: currentUser.photoURL || "",
            authEmailVerified: currentUser.emailVerified,
            authReady: true,
            lastSignIn: serverTimestamp() as Timestamp,
          });
        } else {
          // User is signed out
          clearAuthDetails();

          // Redirect to home if on a protected route
          if (isProtectedRoute) {
            router.push("/");
          }
        }

        setLoading(false);
      });
    } catch (error) {
      console.error("Error setting up auth state listener:", error);
      queueMicrotask(() => setLoading(false));
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [setAuthDetails, clearAuthDetails, router, isProtectedRoute]);

  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
