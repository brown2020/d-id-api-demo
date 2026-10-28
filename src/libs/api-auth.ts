import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminAuth } from "@/firebase/firebaseAdmin";
import { SESSION_COOKIE_NAME } from "@/libs/auth-constants";
import { isLocalDevelopment } from "@/libs/deploy-env";

export { isLocalDevelopment };

export function isProductionDeploy(): boolean {
  return !isLocalDevelopment();
}

export async function requireApiSession(): Promise<
  { uid: string } | NextResponse
> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return { uid: decoded.uid };
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/** Diagnostic endpoints — available only on a local development server. */
export function requireLocalDevelopment(): NextResponse | null {
  if (isLocalDevelopment()) {
    return null;
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** @deprecated Use requireLocalDevelopment. */
export function requireNonProduction(): NextResponse | null {
  return requireLocalDevelopment();
}
