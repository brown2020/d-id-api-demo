import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const videoRef = adminDb.collection("expressive-videos").doc(id);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    const videoData = videoDoc.data();

    return NextResponse.json({
      id: videoData?.id || id,
      status: videoData?.status,
      result_url: videoData?.result_url,
      thumbnail_url: videoData?.thumbnail_url,
      duration: videoData?.duration,
      errorMessage: videoData?.errorMessage,
      demo_mode: videoData?.demo_mode || false,
      demo_notice: videoData?.demo_notice,
      script_text: videoData?.script_text,
    });
  } catch (error) {
    console.error("Error fetching expressive video:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
