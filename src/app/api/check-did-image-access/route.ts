import { NextResponse } from "next/server";

/**
 * This endpoint simulates how D-ID might access our images
 * It helps diagnose image accessibility issues from D-ID's perspective
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({
      success: false,
      error: "No URL provided",
    });
  }

  console.log(`Testing D-ID image access simulation for: ${imageUrl}`);

  try {
    // First try with a HEAD request (faster)
    const headResponse = await fetch(imageUrl, {
      method: "HEAD",
      headers: {
        // Use headers that mimic D-ID's service
        "User-Agent": "Mozilla/5.0 D-ID-API-Service",
        Accept: "image/png,image/jpeg,image/*;q=0.8",
        Origin: "https://api.d-id.com",
        Referer: "https://api.d-id.com/",
      },
    }).catch((err) => {
      console.log("HEAD request failed:", err.message);
      return null;
    });

    // If HEAD request succeeded
    if (headResponse && headResponse.ok) {
      const contentType = headResponse.headers.get("content-type");
      return NextResponse.json({
        success: true,
        method: "HEAD",
        status: headResponse.status,
        contentType,
        headers: Object.fromEntries(headResponse.headers.entries()),
      });
    }

    // If HEAD failed, try GET (more reliable but slower)
    console.log("HEAD request failed or returned non-ok status, trying GET...");
    const getResponse = await fetch(imageUrl, {
      method: "GET",
      headers: {
        // Use headers that mimic D-ID's service
        "User-Agent": "Mozilla/5.0 D-ID-API-Service",
        Accept: "image/png,image/jpeg,image/*;q=0.8",
        Origin: "https://api.d-id.com",
        Referer: "https://api.d-id.com/",
      },
    });

    if (getResponse.ok) {
      const contentType = getResponse.headers.get("content-type");
      const arrayBuffer = await getResponse.arrayBuffer();

      return NextResponse.json({
        success: true,
        method: "GET",
        status: getResponse.status,
        contentType,
        size: arrayBuffer.byteLength,
        headers: Object.fromEntries(getResponse.headers.entries()),
      });
    } else {
      return NextResponse.json({
        success: false,
        method: "GET",
        status: getResponse.status,
        statusText: getResponse.statusText,
        error: `Failed with status ${getResponse.status}`,
        headers: Object.fromEntries(getResponse.headers.entries()),
      });
    }
  } catch (error) {
    console.error("Error simulating D-ID access:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
