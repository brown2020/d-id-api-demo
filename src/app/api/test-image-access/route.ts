import { NextResponse } from "next/server";

import { requireNonProduction } from "@/libs/api-auth";

export async function GET(req: Request) {
  const blocked = requireNonProduction();
  if (blocked) {
    return blocked;
  }

  const url = new URL(req.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({
      success: false,
      error: "No URL provided",
    });
  }

  try {
    const response = await fetch(imageUrl, {
      method: "HEAD",
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: `Failed with status ${response.status}`,
      });
    }

    const contentType = response.headers.get("content-type");

    return NextResponse.json({
      success: true,
      status: response.status,
      contentType,
    });
  } catch (error) {
    console.error("Error testing image access:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
