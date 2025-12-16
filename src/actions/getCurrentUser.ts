"use server";

import { adminAuth } from "@/firebase/firebaseAdmin";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/libs/auth-constants";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

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
