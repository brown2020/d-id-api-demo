import { isExactFallbackImageUrl } from "@/libs/storage-url";

type HeaderSource = {
  get(name: string): string | null;
};

function originOf(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.username !== "" || url.password !== "") {
      return null;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Origins this request is allowed to treat as the application itself.
 * Client-supplied base URLs must match one of these.
 */
export function allowedAppOriginsFromHeaders(headerList: HeaderSource): string[] {
  const origins = new Set<string>();
  const forwardedHost = headerList.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerList.get("host")?.trim();
  const proto = headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";

  if (host && !host.includes("/") && !host.includes(" ") && !host.includes("@")) {
    const forwardedProto = headerList.get("x-forwarded-proto");
    const schemes = forwardedProto ? [proto] : ["https", "http"];
    for (const scheme of schemes) {
      const fromRequest = originOf(`${scheme}://${host}`);
      if (fromRequest) {
        origins.add(fromRequest);
      }
    }
  }

  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured) {
    const parsed = originOf(configured);
    if (parsed) {
      origins.add(parsed);
    }
  }

  origins.add("https://didapidemo.vercel.app");
  return [...origins];
}

export function isAllowedAppBaseUrl(baseUrl: string, allowedOrigins: string[]): boolean {
  const origin = originOf(baseUrl);
  if (!origin) {
    return false;
  }
  return allowedOrigins.includes(origin);
}

/** Source image sent to D-ID: our fallback asset, or a URL on this app origin. */
export function isAllowedGenerationImageUrl(
  imageUrl: string,
  allowedOrigins: string[]
): boolean {
  if (isExactFallbackImageUrl(imageUrl)) {
    return true;
  }
  const origin = originOf(imageUrl);
  if (!origin) {
    return false;
  }
  return allowedOrigins.includes(origin);
}
