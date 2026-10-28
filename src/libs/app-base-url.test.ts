import { describe, expect, it } from "vitest";

import {
  allowedAppOriginsFromHeaders,
  isAllowedAppBaseUrl,
  isAllowedGenerationImageUrl,
} from "@/libs/app-base-url";

function headers(values: Record<string, string>): { get(name: string): string | null } {
  return {
    get(name: string) {
      return values[name.toLowerCase()] ?? null;
    },
  };
}

describe("app base URL allowlist", () => {
  it("accepts the request host and the canonical app origin", () => {
    const allowed = allowedAppOriginsFromHeaders(
      headers({ host: "abc.ngrok-free.app", "x-forwarded-proto": "https" })
    );
    expect(isAllowedAppBaseUrl("https://abc.ngrok-free.app", allowed)).toBe(true);
    expect(isAllowedAppBaseUrl("https://didapidemo.vercel.app/videos", allowed)).toBe(true);
    expect(isAllowedAppBaseUrl("https://evil.example", allowed)).toBe(false);
    const local = allowedAppOriginsFromHeaders(headers({ host: "localhost:3000" }));
    expect(isAllowedAppBaseUrl("http://localhost:3000", local)).toBe(true);
    expect(isAllowedAppBaseUrl("http://169.254.169.254", allowed)).toBe(false);
  });

  it("allows generation images only on the app origin or the fallback asset", () => {
    const allowed = ["https://didapidemo.vercel.app"];
    expect(
      isAllowedGenerationImageUrl(
        "https://didapidemo.vercel.app/api/video-image-proxy/a.png",
        allowed
      )
    ).toBe(true);
    expect(
      isAllowedGenerationImageUrl(
        "https://didapidemo.vercel.app/assets/headshot_fallback.png",
        allowed
      )
    ).toBe(true);
    expect(isAllowedGenerationImageUrl("https://evil.example/a.png", allowed)).toBe(false);
  });
});
