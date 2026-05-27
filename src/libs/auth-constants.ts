export const SESSION_COOKIE_NAME = "__session" as const;

// Keep in sync with `src/proxy.ts` and client redirects in `FirebaseAuthProvider`.
export const PROTECTED_PATH_PREFIXES = [
  "/avatars",
  "/generate",
  "/payment-attempt",
  "/payment-success",
  "/profile",
  "/videos",
] as const;

/** Statuses that allow (re)submitting generation for an existing video doc. */
export const EDITABLE_VIDEO_STATUSES = new Set([
  "",
  "created",
  "draft",
  "error",
]);

export function isProtectedPathname(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Validates post-login redirect targets — same-origin relative paths only.
 */
export function getSafeCallbackUrl(
  callbackUrl: string | null | undefined
): string | null {
  if (!callbackUrl) {
    return null;
  }

  const trimmed = callbackUrl.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return null;
  }

  return trimmed;
}

export function isEditableVideoStatus(status: unknown): boolean {
  if (status === undefined || status === null) {
    return true;
  }
  return EDITABLE_VIDEO_STATUSES.has(String(status));
}
