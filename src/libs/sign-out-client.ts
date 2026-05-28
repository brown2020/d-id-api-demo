"use client";

import { signOut } from "firebase/auth";

import { auth } from "@/firebase/firebaseClient";

/** Clears the server session cookie and Firebase client auth. */
export async function signOutUser(): Promise<void> {
  await fetch("/api/auth", { method: "DELETE" });
  await signOut(auth);
}
