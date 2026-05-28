import { NextResponse } from "next/server";

import { requireNonProduction } from "@/libs/api-auth";
import { checkDidImageAccess } from "@/libs/did-image-access";

/**
 * Simulates how D-ID might access our images.
 * Blocked in production; available in dev/preview for diagnostics.
 */
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

  const result = await checkDidImageAccess(imageUrl);
  return NextResponse.json(result);
}
