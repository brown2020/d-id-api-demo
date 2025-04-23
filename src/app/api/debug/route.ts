import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/libs/utils";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // Get information about the request
    const info = {
      requestUrl: req.url,
      headers: Object.fromEntries(req.headers.entries()),
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
