import { NextResponse } from "next/server";

import { requireApiSession } from "@/libs/api-auth";
import { DOCUMENT_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function GET() {
  const auth = await requireApiSession();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const snapshot = await adminDb.collection(DOCUMENT_COLLECTION).get();
    const avatarIds = snapshot.docs.map((doc) => doc.id);

    return NextResponse.json({ avatarIds }, { status: 200 });
  } catch (error) {
    console.error("Error fetching avatar IDs:", error);
    return NextResponse.json(
      { error: "Failed to fetch avatar IDs" },
      { status: 500 }
    );
  }
}
