import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { requireApiSession, requireLocalDevelopment } from "@/libs/api-auth";
import {
  allowedAppOriginsFromHeaders,
  isAllowedGenerationImageUrl,
} from "@/libs/app-base-url";
import { checkDidImageAccess } from "@/libs/did-image-access";

/**
 * Simulates how D-ID might access our images.
 * Available only in local development, and only for this app's own image URLs.
 */
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

  const allowed = allowedAppOriginsFromHeaders(await headers());
  if (!isAllowedGenerationImageUrl(imageUrl, allowed)) {
    return NextResponse.json({
      success: false,
      error: "URL host is not allowlisted",
    });
  }

  const result = await checkDidImageAccess(imageUrl);
  return NextResponse.json(result);
}
