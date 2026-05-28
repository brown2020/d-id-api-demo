import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminAuth } from "@/firebase/firebaseAdmin";
import { SESSION_COOKIE_NAME } from "@/libs/auth-constants";

export function isProductionDeploy(): boolean {
  return process.env.VERCEL_ENV === "production";
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

/** Dev-only diagnostic endpoints — blocked in production deploys. */
export function requireNonProduction(): NextResponse | null {
  if (isProductionDeploy()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}
