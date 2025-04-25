"use client";

import { auth } from "../firebase/firebaseClient";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useState, useEffect } from "react";
import { useAuth } from "./FirebaseAuthProvider";
import { LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { FirebaseError } from "firebase/app";

// Add a debug function to log the auth configuration
function logAuthConfiguration() {
  // Get the current auth configuration
  const currentConfig = auth.config;
  // Log only non-sensitive parts
  console.log("Auth configuration:", {
    apiHost: currentConfig.apiHost,
    authDomain: currentConfig.authDomain,
    apiKey: currentConfig.apiKey ? "PRESENT" : "MISSING",
  });

  // Only log hostname if in browser environment
  if (typeof window !== "undefined") {
    console.log("Current hostname:", window.location.hostname);
  }
}

export const FirebaseAuth = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Call the debug function in useEffect to ensure it only runs client-side
  useEffect(() => {
    logAuthConfiguration();
  }, []);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();

      // Configure the provider to maximize compatibility with domain restrictions
      provider.setCustomParameters({
        // Forces account selection even when one account is available
        prompt: "select_account",
        // Use the exact auth domain from Firebase config to avoid domain mismatch
        auth_host_domain: auth.config.authDomain || window.location.hostname,
        // Add additional scopes if needed for more permissions
        // scope: 'email profile',
      });

      // Try popup auth with proper error handling
      let userCredential;
      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupError: unknown) {
        console.error("Popup error:", popupError);

        // Type guard to ensure it's a FirebaseError before accessing properties
        if (popupError instanceof FirebaseError) {
          console.error("Firebase error:", popupError.code, popupError.message);
          // If it's an unauthorized domain error, log helpful info
          if (popupError.code === "auth/unauthorized-domain") {
            console.error("==== DOMAIN VERIFICATION ERROR ====");
            console.error("Current domain:", window.location.hostname);
            console.error(
              "Authorized domains in Firebase:",
              auth.config.authDomain
            );
            console.error(
              "Make sure the current domain is added to the Firebase Console:"
            );
            console.error(
              "Firebase Console > Authentication > Settings > Authorized domains"
            );
            console.error("==================================");

            throw new Error(
              "This domain is not authorized for Firebase authentication. Please contact the administrator."
            );
          }
          throw popupError;
        }
        // If it's not a FirebaseError, rethrow it
        throw popupError;
      }

      // Get the Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Send the token to the server to create a session cookie
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      toast.success("Signed in successfully");

      // Refresh the page to update auth state
      window.location.reload();
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast.error("Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);

      // Call the API to clear the session cookie
      await fetch("/api/auth", {
        method: "DELETE",
      });

      // Sign out from Firebase
      await signOut(auth);

      toast.success("Signed out successfully");

      // Refresh the page to update auth state
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="text-white bg-gray-600 h-full px-4 py-2 rounded-lg flex items-center justify-center"
        disabled={loading}
      >
        {loading ? <LoaderCircle className="animate-spin" /> : "Sign Out"}
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="text-white bg-blue-500 h-full px-4 py-2 rounded-lg flex items-center justify-center"
      disabled={loading}
    >
      {loading ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        "Sign In with Google"
      )}
    </button>
  );
};
