import { NextResponse } from "next/server";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function GET() {
  try {
    // Fetch documents from the collection
    console.log(`Fetching videos from collection: ${VIDEO_COLLECTION}`);
    const snapshot = await adminDb.collection(VIDEO_COLLECTION).get();

    // Extract document IDs
    const videoIds = snapshot.docs.map((doc) => doc.id);
    console.log(`Found ${videoIds.length} videos`);

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
