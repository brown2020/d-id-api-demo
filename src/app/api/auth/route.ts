"use server";

import { adminAuth } from "../../../firebase/firebaseAdmin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Set session cookie
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set cookie options
    const options = {
      name: "__session",
      value: sessionCookie,
      maxAge: expiresIn,
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
      name: "__session",
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
