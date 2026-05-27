import { NextResponse } from "next/server";

import { requireNonProduction } from "@/libs/api-auth";
import { getApiBaseUrl } from "@/libs/utils";

export async function GET(req: Request) {
  const blocked = requireNonProduction();
  if (blocked) {
    return blocked;
  }

  try {
    const url = new URL(req.url);

    const info = {
      requestUrl: req.url,
      envBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "(not set)",
      computedBaseUrl: getApiBaseUrl(),
      hostname: url.hostname,
      pathname: url.pathname,
      origin: url.origin,
      protocol: url.protocol,
    };

    return NextResponse.json(info, { status: 200 });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug error", details: String(error) },
      { status: 500 }
    );
  }
}
