import { adminAuth } from "@/firebase/firebaseAdmin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/libs/auth-constants";

// Set session cookie
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    // Create a session cookie
    const expiresInMs = 60 * 60 * 24 * 5 * 1000; // 5 days
    const maxAgeSeconds = Math.floor(expiresInMs / 1000);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: expiresInMs,
    });

    // Set cookie options
    const options = {
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      // next/headers cookie `maxAge` is seconds (Firebase `expiresIn` is ms)
      maxAge: maxAgeSeconds,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    };

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set(options);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// Clear session cookie (sign out)
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
