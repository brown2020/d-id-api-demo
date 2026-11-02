import { readFileSync, statSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  DEMO_MODE_NO_KEY_NOTICE,
  SAMPLE_TALKING_AVATAR_IMAGE,
  SAMPLE_TALKING_AVATAR_VIDEO,
  classifyDidDemoFallback,
  demoSample,
  noKeyGeneratePlan,
  resolveDidCredentials,
} from "@/libs/did-demo";
import {
  builtinDemoAvatar,
  canEnableGenerate,
  canvasAvatarImageUrl,
  fallbackVoices,
  missingVideoIdBlocksGenerate,
  shouldDrawSelectedAvatar,
  talkingPhotoSelection,
  withBuiltinDemoAvatar,
} from "@/libs/fallback-voices";

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

describe("no-key generate path", () => {
  it("returns the bundled sample and the demo notice", () => {
    const plan = noKeyGeneratePlan("", null, "");
    expect(plan.demoMode).toBe(true);
    if (!plan.demoMode) {
      return;
    }
    expect(plan.notice).toBe(DEMO_MODE_NO_KEY_NOTICE);
    expect(plan.videoUrl).toBe(SAMPLE_TALKING_AVATAR_VIDEO);
    expect(plan.imageUrl).toBe(SAMPLE_TALKING_AVATAR_IMAGE);
    expect(plan.reason).toBe("missing_key");
  });

  it("enables generate for the built-in avatar and its default voice", () => {
    const avatars = withBuiltinDemoAvatar([], false);
    expect(avatars).toHaveLength(1);
    const avatar = avatars[0] ?? builtinDemoAvatar();
    expect(avatar.preview_image_url).toBe(SAMPLE_TALKING_AVATAR_IMAGE);
    const voices = fallbackVoices();
    expect(voices.length).toBeGreaterThan(0);
    const voice = voices.find((item) => item.voiceId === avatar.voiceId) ?? null;
    expect(canEnableGenerate(avatar, voice)).toBe(true);
    expect(withBuiltinDemoAvatar([], true)).toEqual([]);
  });

  it("keeps a live plan when a key is present", () => {
    expect(noKeyGeneratePlan("user:secret", "", "").demoMode).toBe(false);
  });
});

describe("create-video demo path", () => {
  const origin = "https://d-id-api-demo-git-dev-ignitechannel.vercel.app";

  it("draws a selected gallery avatar even when there are no personal photos", () => {
    const [demo] = withBuiltinDemoAvatar([], false);
    expect(demo?.talking_photo_id).toBe("demo-sample-avatar");
    expect(
      shouldDrawSelectedAvatar({
        hasUser: true,
        selectedAvatarId: demo?.talking_photo_id,
        canvasReady: true,
      })
    ).toBe(true);
    expect(
      shouldDrawSelectedAvatar({
        hasUser: true,
        selectedAvatarId: null,
        canvasReady: true,
      })
    ).toBe(false);
  });

  it("loads the bundled preview and still calls generate without a draft id", () => {
    const avatar = builtinDemoAvatar();
    const imageUrl = canvasAvatarImageUrl(avatar, {
      isLocalhost: false,
      origin,
    });
    expect(imageUrl).toBe(`${origin}${SAMPLE_TALKING_AVATAR_IMAGE}`);
    expect(imageUrl).not.toContain("/api/imageproxy/");
    expect(missingVideoIdBlocksGenerate(null, false)).toBe(false);
    expect(missingVideoIdBlocksGenerate("", false)).toBe(false);
    expect(talkingPhotoSelection(avatar.talking_photo_id)).toEqual({
      selectedTalkingPhoto: avatar.talking_photo_id,
    });
  });

  it("keeps the proxy and the video-id guard when a D-ID key exists", () => {
    const imageUrl = canvasAvatarImageUrl(
      {
        talking_photo_id: "tp_live",
        preview_image_url: "https://cdn.example/avatar.png",
      },
      { isLocalhost: false, origin }
    );
    expect(imageUrl).toBe(`${origin}/api/imageproxy/tp_live.png`);
    expect(missingVideoIdBlocksGenerate(null, true)).toBe(true);
    expect(missingVideoIdBlocksGenerate("new-video-1", true)).toBe(false);
    expect(withBuiltinDemoAvatar([], true)).toEqual([]);
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
