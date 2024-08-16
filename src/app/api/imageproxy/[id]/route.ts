import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Extract the Firestore document ID (remove .png extension)
  const docId = id.replace(".png", "");

  // Fetch the Firestore document
  const docRef = doc(db, "didTalkingPhotos", docId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const data = docSnap.data();

  if (!data?.preview_image_url) {
    return NextResponse.json({ error: "Image URL not found" }, { status: 404 });
  }

  const imageUrl = data.preview_image_url;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch the image" },
        { status: 500 }
      );
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch the image" },
      { status: 500 }
    );
  }
}
