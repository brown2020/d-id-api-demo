import { describe, expect, it } from "vitest";

import {
  getWebhookUrl,
  isPublicWebhookBaseUrl,
} from "@/libs/webhook-url";

describe("isPublicWebhookBaseUrl", () => {
  it("rejects localhost and non-HTTPS URLs", () => {
    expect(isPublicWebhookBaseUrl("http://localhost:3000")).toBe(false);
    expect(isPublicWebhookBaseUrl("http://127.0.0.1:3000")).toBe(false);
    expect(isPublicWebhookBaseUrl("http://didapidemo.vercel.app")).toBe(false);
  });

  it("accepts public HTTPS URLs", () => {
    expect(isPublicWebhookBaseUrl("https://didapidemo.vercel.app")).toBe(true);
    expect(isPublicWebhookBaseUrl("https://abc123.ngrok-free.app")).toBe(true);
  });
});

describe("getWebhookUrl", () => {
  it("returns null when the base URL is not webhook-eligible", () => {
    expect(getWebhookUrl("http://localhost:3000", "vid-1", "secret")).toBeNull();
  });

  it("builds the video-generated webhook path with encoded params", () => {
    expect(
      getWebhookUrl("https://didapidemo.vercel.app/", "vid-1", "tok/en")
    ).toBe(
      "https://didapidemo.vercel.app/api/video-generated/vid-1?token=tok%2Fen"
    );
  });
});
