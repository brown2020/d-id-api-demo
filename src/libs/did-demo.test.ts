import { readFileSync, statSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  DEMO_MODE_NO_KEY_NOTICE,
  SAMPLE_TALKING_AVATAR_IMAGE,
  SAMPLE_TALKING_AVATAR_VIDEO,
  classifyDidDemoFallback,
  demoSample,
  resolveDidCredentials,
} from "@/libs/did-demo";

describe("resolveDidCredentials", () => {
  it("keeps a profile key ahead of the server key", () => {
    expect(resolveDidCredentials("user:secret", "", "env:secret")).toEqual({
      apiKey: "user:secret",
      basicAuth: "",
    });
  });

  it("uses DID_API_KEY when the profile has no D-ID credentials", () => {
    expect(resolveDidCredentials("  ", null, "env:secret")).toEqual({
      apiKey: "env:secret",
      basicAuth: "",
    });
  });

  it("returns null when every key is missing", () => {
    expect(resolveDidCredentials("", "  ", "")).toBeNull();
    expect(resolveDidCredentials(undefined, undefined, undefined)).toBeNull();
  });
});

describe("classifyDidDemoFallback", () => {
  it("maps auth, credit, and quota failures onto the sample", () => {
    expect(classifyDidDemoFallback(401, "")).toBe("auth");
    expect(classifyDidDemoFallback(403, "forbidden")).toBe("auth");
    expect(classifyDidDemoFallback(402, "")).toBe("credits");
    expect(classifyDidDemoFallback(429, "")).toBe("quota");
    expect(classifyDidDemoFallback(400, "Account quota exceeded")).toBe("quota");
    expect(classifyDidDemoFallback(500, "You are out of credits")).toBe("credits");
  });

  it("leaves validation and other provider failures as errors", () => {
    expect(classifyDidDemoFallback(400, "CelebrityDetectedError")).toBeNull();
    expect(classifyDidDemoFallback(500, "internal error")).toBeNull();
    expect(classifyDidDemoFallback(undefined, "network down")).toBeNull();
  });
});

describe("demoSample", () => {
  it("uses the no-key notice and the bundled files", () => {
    const sample = demoSample("missing_key");
    expect(sample.notice).toBe(DEMO_MODE_NO_KEY_NOTICE);
    expect(sample.videoUrl).toBe(SAMPLE_TALKING_AVATAR_VIDEO);
    expect(sample.imageUrl).toBe(SAMPLE_TALKING_AVATAR_IMAGE);
  });

  it("ships a small original video and image", () => {
    const video = statSync("public/demo/sample-talking-avatar.mp4");
    const image = readFileSync("public/demo/sample-talking-avatar.png");
    expect(video.size).toBeGreaterThan(200);
    expect(video.size).toBeLessThan(200_000);
    expect(image.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(image.length).toBeLessThan(100_000);
  });
});
