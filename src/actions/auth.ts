"use server";

import { adminAuth } from "@/firebase/firebaseAdmin";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/libs/auth-constants";

// Auth error class
class AuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

// Function to protect server actions - replacement for Clerk's auth.protect()
export async function protect() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    throw new AuthError("Authentication required");
  }

  try {
    // Verify the session cookie and check if it was revoked
    const checkRevoked = true;
    const decodedClaims = await adminAuth.verifySessionCookie(
      session,
      checkRevoked
    );

    return decodedClaims.uid;
  } catch (error) {
    console.error("Error verifying session:", error);
    throw new AuthError("Invalid or expired session");
  }
}

// Function to get the current user from the session
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
