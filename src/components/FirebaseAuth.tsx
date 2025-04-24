"use client";

import { auth } from "../firebase/firebaseClient";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { useAuth } from "./FirebaseAuthProvider";
import { LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";

export const FirebaseAuth = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

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
