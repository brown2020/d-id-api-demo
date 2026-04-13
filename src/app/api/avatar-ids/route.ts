import { NextResponse } from "next/server";
import { DOCUMENT_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function GET() {
  try {
    // Fetch documents from the collection
    const snapshot = await adminDb.collection(DOCUMENT_COLLECTION).get();

    // Extract document IDs
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
