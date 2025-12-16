export const SESSION_COOKIE_NAME = "__session" as const;

// Keep this in sync with route-level protections in `src/proxy.ts` and client-side redirects.
export const PROTECTED_PATH_PREFIXES = [
  "/avatars",
  "/generate",
  "/payment-attempt",
  "/payment-success",
  "/profile",
] as const;

export function isProtectedPathname(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}


