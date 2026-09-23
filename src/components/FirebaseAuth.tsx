"use client";

import { auth, isFirebaseConfigured } from "../firebase/firebaseClient";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useState, useEffect } from "react";
import { useAuth } from "./FirebaseAuthProvider";
import { LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { getSafeCallbackUrl } from "@/libs/auth-constants";
import { signOutUser } from "@/libs/sign-out-client";
import { EmailPasswordAuth } from "./EmailPasswordAuth";
import {
  formatFirebaseAuthErrorForLog,
  mapFirebaseAuthError,
} from "@/libs/firebaseAuthErrors";

type AuthView = "main" | "email";

function logAuthConfiguration() {
  if (!isFirebaseConfigured) {
    console.warn("[auth] Firebase auth not configured");
    return;
  }
  const currentConfig = auth.config;
  console.warn("[auth] Auth configuration:", {
    apiHost: currentConfig.apiHost,
    authDomain: currentConfig.authDomain,
    apiKey: currentConfig.apiKey ? "PRESENT" : "MISSING",
  });

  if (typeof window !== "undefined") {
    console.warn("[auth] Current hostname:", window.location.hostname);
  }
}

async function establishSession(idToken: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    throw new Error("session-network");
  }

  if (!response.ok) {
    throw new Error(`session-http-${response.status}`);
  }
}

export const FirebaseAuth = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<AuthView>("main");

  useEffect(() => {
    logAuthConfiguration();
  }, []);

  const handleSignIn = async () => {
    try {
      if (!isFirebaseConfigured) {
        toast.error("Firebase is not configured in this environment.");
        return;
      }
      setLoading(true);
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
        auth_host_domain: auth.config.authDomain || window.location.hostname,
      });

      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      await establishSession(idToken);

      toast.success("Signed in successfully");

      const callbackUrl = getSafeCallbackUrl(
        new URLSearchParams(window.location.search).get("callbackUrl")
      );
      window.location.href = callbackUrl ?? window.location.pathname;
    } catch (error) {
      console.warn(
        `[auth] Google sign-in failed: ${formatFirebaseAuthErrorForLog(error)}`
      );
      if (
        error instanceof Error &&
        (error.message === "session-network" ||
          error.message.startsWith("session-http-"))
      ) {
        toast.error(
          "Signed in with Google, but session setup failed. Please try again."
        );
      } else {
        toast.error(
          mapFirebaseAuthError(error, "Failed to sign in with Google.")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      if (typeof window !== "undefined") {
        sessionStorage.clear();
      }
      toast.success("Signed out successfully");
      window.location.href = "/";
    } catch (error) {
      console.warn(
        `[auth] Sign out failed: ${formatFirebaseAuthErrorForLog(error)}`
      );
      toast.error(mapFirebaseAuthError(error, "Failed to sign out"));
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className="text-white bg-gray-600 h-full px-4 py-2 rounded-lg flex items-center justify-center"
        disabled={loading}
      >
        {loading ? <LoaderCircle className="animate-spin" /> : "Sign Out"}
      </button>
    );
  }

  if (view === "email") {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => setView("main")}
          className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to sign in options
        </button>
        <EmailPasswordAuth />
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      <button
        type="button"
        onClick={handleSignIn}
        className="w-full text-white bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        disabled={loading}
      >
        {loading ? (
          <LoaderCircle className="animate-spin h-5 w-5" />
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </>
        )}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setView("email")}
        className="w-full text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        disabled={loading}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        Sign in with Email
      </button>
    </div>
  );
};
