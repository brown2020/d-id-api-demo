import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require authentication
const protectedPaths = [
  "/avatars",
  "/generate",
  "/payment-attempt",
  "/payment-success",
  "/profile",
];

export async function middleware(request: NextRequest) {
  // Check if the path matches any protected path
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // No checks needed for non-protected paths
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // For protected paths, check if the user has a valid session cookie
  const sessionCookie = request.cookies.get("__session")?.value;

  // If no session cookie is found, redirect to the login page
  if (!sessionCookie) {
    const redirectUrl = new URL("/", request.url);
    // Add the original URL as a parameter to redirect back after login
    redirectUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Session cookie exists, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
