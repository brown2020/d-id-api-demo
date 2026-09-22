import { NextResponse } from "next/server";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;


  // Extract the Firestore document ID (remove .png extension)
  const docId = id.replace(".png", "");

  try {
    // Fetch the Firestore document
    const docRef = adminDb.collection(VIDEO_COLLECTION).doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Document not found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    const data = docSnap.data();

    if (!data || !data.thumbnail_url) {
      return NextResponse.json(
        { error: "Image URL not found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    const imageUrl = data.thumbnail_url;

    try {
      // Add extensive logging for troubleshooting

      const response = await fetch(imageUrl, {
        headers: {
          Accept: "image/png,image/*;q=0.8",
          "User-Agent": "Mozilla/5.0 D-ID-API-Proxy",
        },
      });


      if (!response.ok) {

        // Try using the fallback image instead of failing completely

        try {
          const fallbackUrl =
            "https://didapidemo.vercel.app/assets/headshot_fallback.png";
          const fallbackResponse = await fetch(fallbackUrl);

          if (fallbackResponse.ok) {
            const contentType =
              fallbackResponse.headers.get("content-type") || "image/png";
            const imageBuffer = await fallbackResponse.arrayBuffer();

            return new NextResponse(imageBuffer, {
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "X-Using-Fallback": "true",
              },
            });
          }
        } catch {
        }

        // Original image failed and fallback failed too
        return NextResponse.json(
          {
            error: `Failed to fetch the image: ${response.status} ${response.statusText}`,
            url: imageUrl,
          },
          {
            status: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
              "Cache-Control": "no-cache",
            },
          }
        );
      }

      const contentType = response.headers.get("content-type") || "image/png";
      const imageBuffer = await response.arrayBuffer();


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

      // Try using the fallback image instead of failing completely

      try {
        const fallbackUrl =
          "https://didapidemo.vercel.app/assets/headshot_fallback.png";
        const fallbackResponse = await fetch(fallbackUrl);

        if (fallbackResponse.ok) {
          const contentType =
            fallbackResponse.headers.get("content-type") || "image/png";
          const imageBuffer = await fallbackResponse.arrayBuffer();

          return new NextResponse(imageBuffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type, Authorization",
              "X-Using-Fallback": "true",
            },
          });
        }
      } catch {
      }

      // Both original and fallback failed
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
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Cache-Control": "no-cache",
          },
        }
      );
    }
  } catch (error) {

    // Try using the fallback image instead of failing completely

    try {
      const fallbackUrl =
        "https://didapidemo.vercel.app/assets/headshot_fallback.png";
      const fallbackResponse = await fetch(fallbackUrl);

      if (fallbackResponse.ok) {
        const contentType =
          fallbackResponse.headers.get("content-type") || "image/png";
        const imageBuffer = await fallbackResponse.arrayBuffer();

        return new NextResponse(imageBuffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "X-Using-Fallback": "true",
          },
        });
      }
    } catch {
    }

    return NextResponse.json(
      {
        error: "Server error",
        details: String(error),
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}

// Add OPTIONS method to handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
