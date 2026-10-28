import { NextResponse } from "next/server";

import { requireApiSession, requireLocalDevelopment } from "@/libs/api-auth";
import {
  isExactFallbackImageUrl,
  storageObjectPathFromUrl,
} from "@/libs/storage-url";

function isAllowedImageUrl(raw: string): boolean {
  if (isExactFallbackImageUrl(raw)) {
    return true;
  }
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET ?? "";
  return storageObjectPathFromUrl(raw, bucket) !== null;
}

export async function GET(req: Request) {
  const blocked = requireLocalDevelopment();
  if (blocked) {
    return blocked;
  }

  const auth = await requireApiSession();
  if (auth instanceof NextResponse) {
    return auth;
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
