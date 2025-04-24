"use server";

import { adminAuth } from "@/firebase/firebaseAdmin";
import { cookies } from "next/headers";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__session")?.value;

  if (!session) {
    return null;
  }

  try {
    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(session);

    // Get the user from Firebase Auth
    const user = await adminAuth.getUser(decodedClaims.uid);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error("Error verifying session:", error);
    return null;
  }
}
