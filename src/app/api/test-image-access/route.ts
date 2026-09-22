import { NextResponse } from "next/server";

import { requireNonProduction } from "@/libs/api-auth";

function isAllowedImageUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    // Block obvious open-redirect style hosts; allow firebase/storage/cdn + ngrok for local demos
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith("googleapis.com") ||
      host.endsWith("firebasestorage.app") ||
      host.endsWith("ngrok-free.app") ||
      host.endsWith("ngrok.io") ||
      host === "localhost"
    );
  } catch {
    return false;
  }
}

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

  if (!isAllowedImageUrl(imageUrl)) {
    return NextResponse.json({
      success: false,
      error: "URL host is not allowlisted",
    });
  }

  try {
    const response = await fetch(imageUrl, {
      method: "HEAD",
      redirect: "error",
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
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
