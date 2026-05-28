import { NextResponse } from "next/server";

import { requireApiSession } from "@/libs/api-auth";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function GET() {
  const auth = await requireApiSession();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const snapshot = await adminDb.collection(VIDEO_COLLECTION).get();
    const videoIds = snapshot.docs.map((doc) => doc.id);

    return NextResponse.json(
      { videoIds },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching video IDs:", error);
    return NextResponse.json(
      { error: "Failed to fetch video IDs" },
      { status: 500 }
    );
  }
}
