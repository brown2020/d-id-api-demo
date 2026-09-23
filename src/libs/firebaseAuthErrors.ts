/**
 * Map Firebase Auth error codes to short, user-facing messages.
 * Never surface raw FirebaseError text in the UI.
 * Never pass the raw Error to console.error / logger.error — Next 16 overlays it.
 */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential":
    "Incorrect email or password. Try again or reset your password.",
  "auth/user-not-found":
    "No account found with that email. Create an account or check the address.",
  "auth/wrong-password":
    "Incorrect password. Try again or reset your password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-password": "Enter your password.",
  "auth/missing-email": "Enter your email address.",
  "auth/email-already-in-use":
    "An account with that email already exists. Sign in instead.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests":
    "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed":
    "Network error. Check your connection and try again.",
  "auth/popup-closed-by-user":
    "Sign in was cancelled. Please try again.",
  "auth/cancelled-popup-request":
    "Sign in was cancelled. Please try again.",
  "auth/popup-blocked":
    "Pop-up blocked. Allow pop-ups for this site and try again.",
  "auth/unauthorized-domain":
    "This domain is not authorized for sign-in. Contact the administrator.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
  "auth/operation-not-allowed":
    "This sign-in method is not available. Try another option.",
  "auth/requires-recent-login":
    "For security, sign in again and retry.",
  "auth/invalid-action-code":
    "This reset link is invalid or has expired. Request a new one.",
  "auth/expired-action-code":
    "This reset link has expired. Request a new one.",
};

export function getFirebaseAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function mapFirebaseAuthError(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const code = getFirebaseAuthErrorCode(error);
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code];
  }

  // Fallback: some SDK wrappers only put the code in the message string.
  if (error instanceof Error) {
    for (const [key, message] of Object.entries(AUTH_ERROR_MESSAGES)) {
      if (error.message.includes(key)) return message;
    }
    if (/network/i.test(error.message)) {
      return AUTH_ERROR_MESSAGES["auth/network-request-failed"];
    }
  }

  return fallback;
}

/** Safe string for logger / console — never pass the raw Error (Next overlays it). */
export function formatFirebaseAuthErrorForLog(error: unknown): string {
  const code = getFirebaseAuthErrorCode(error);
  if (code) return code;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "unknown";
}
