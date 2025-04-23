import { NextResponse } from "next/server";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log(`Video image proxy request for ID: ${id}`);

  // Extract the Firestore document ID (remove .png extension)
  const docId = id.replace(".png", "");

  try {
    // Fetch the Firestore document
    const docRef = adminDb.collection(VIDEO_COLLECTION).doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.error(`Document not found: ${docId}`);
      return NextResponse.json(
        { error: "Document not found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    const data = docSnap.data();

    if (!data || !data.thumbnail_url) {
      console.error(`Image URL not found in document: ${docId}`);
      return NextResponse.json(
        { error: "Image URL not found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    const imageUrl = data.thumbnail_url;
    console.log(`Fetching video thumbnail from: ${imageUrl}`);

    try {
      const response = await fetch(imageUrl, {
        headers: {
          Accept: "image/png,image/*;q=0.8",
          "User-Agent": "Mozilla/5.0 D-ID-API-Proxy",
        },
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );
        return NextResponse.json(
          {
            error: `Failed to fetch the image: ${response.status} ${response.statusText}`,
            url: imageUrl,
          },
          {
            status: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-cache",
            },
          }
        );
      }

      const contentType = response.headers.get("content-type") || "image/png";
      const imageBuffer = await response.arrayBuffer();

      console.log(
        `Successfully fetched video thumbnail (${contentType}, ${imageBuffer.byteLength} bytes)`
      );

      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    } catch (error) {
      console.error("Error fetching image:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch the image",
          details: String(error),
          url: imageUrl,
        },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
          },
        }
      );
    }
  } catch (error) {
    console.error("Error in video image proxy:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: String(error),
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
