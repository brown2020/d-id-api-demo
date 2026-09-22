"use client";

import { signOut } from "firebase/auth";

import { auth, isFirebaseConfigured } from "@/firebase/firebaseClient";

/** Clears the server session cookie and Firebase client auth. */
export async function signOutUser(): Promise<void> {
  await fetch("/api/auth", { method: "DELETE" });
  if (isFirebaseConfigured) {
    await signOut(auth);
  }
}
