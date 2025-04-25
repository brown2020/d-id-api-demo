import { NextResponse } from "next/server";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log(`Video image proxy request for ID: ${id}`);
  console.log(`- Request URL: ${req.url}`);
  console.log(
    `- Request headers: ${JSON.stringify(
      Object.fromEntries(req.headers.entries())
    )}`
  );

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
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    const imageUrl = data.thumbnail_url;
    console.log(`Fetching video thumbnail from: ${imageUrl}`);

    try {
      // Add extensive logging for troubleshooting
      console.log(`Attempting to fetch image from: ${imageUrl}`);

      const response = await fetch(imageUrl, {
        headers: {
          Accept: "image/png,image/*;q=0.8",
          "User-Agent": "Mozilla/5.0 D-ID-API-Proxy",
        },
      });

      console.log(
        `Image fetch response status: ${response.status} ${response.statusText}`
      );
      console.log(
        `Image fetch response headers: ${JSON.stringify(
          Object.fromEntries(response.headers.entries())
        )}`
      );

      if (!response.ok) {
        console.error(
          `Failed to fetch image: ${response.status} ${response.statusText}`
        );

        // Try using the fallback image instead of failing completely
        console.log("Attempting to use fallback image...");

        try {
          const fallbackUrl =
            "https://didapidemo.vercel.app/assets/headshot_fallback.png";
          const fallbackResponse = await fetch(fallbackUrl);

          if (fallbackResponse.ok) {
            console.log("Successfully fetched fallback image");
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
        } catch (fallbackError) {
          console.error("Failed to fetch fallback image:", fallbackError);
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

      // Try using the fallback image instead of failing completely
      console.log("Attempting to use fallback image after error...");

      try {
        const fallbackUrl =
          "https://didapidemo.vercel.app/assets/headshot_fallback.png";
        const fallbackResponse = await fetch(fallbackUrl);

        if (fallbackResponse.ok) {
          console.log("Successfully fetched fallback image");
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
      } catch (fallbackError) {
        console.error("Failed to fetch fallback image:", fallbackError);
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
    console.error("Error in image proxy:", error);

    // Try using the fallback image instead of failing completely
    console.log("Attempting to use fallback image after proxy error...");

    try {
      const fallbackUrl =
        "https://didapidemo.vercel.app/assets/headshot_fallback.png";
      const fallbackResponse = await fetch(fallbackUrl);

      if (fallbackResponse.ok) {
        console.log("Successfully fetched fallback image");
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
    } catch (fallbackError) {
      console.error("Failed to fetch fallback image:", fallbackError);
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
