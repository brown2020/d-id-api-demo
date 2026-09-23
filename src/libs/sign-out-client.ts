"use client";

import { signOut } from "firebase/auth";

import { auth, isFirebaseConfigured } from "@/firebase/firebaseClient";

/** Clears the server session cookie and Firebase client auth. */
export async function signOutUser(): Promise<void> {
  try {
    await fetch("/api/auth", { method: "DELETE" });
  } catch {
    // Session cookie clear is best-effort; continue to client sign-out.
  }
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
}
