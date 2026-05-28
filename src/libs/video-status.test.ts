import { describe, expect, it } from "vitest";

import {
  formatVideoGenerationError,
  isVideoProcessing,
} from "@/libs/video-status";

describe("isVideoProcessing", () => {
  it("returns false when a video URL exists", () => {
    expect(isVideoProcessing({ d_id_status: "created", video_url: "https://x" })).toBe(
      false
    );
  });

  it("returns false for terminal error or done states", () => {
    expect(isVideoProcessing({ d_id_status: "error" })).toBe(false);
    expect(isVideoProcessing({ d_id_status: "done" })).toBe(false);
  });

  it("returns true for in-progress statuses without a URL", () => {
    expect(isVideoProcessing({ d_id_status: "created" })).toBe(true);
    expect(isVideoProcessing({ d_id_status: "processing" })).toBe(true);
    expect(isVideoProcessing({ d_id_status: "" })).toBe(true);
  });
});

describe("formatVideoGenerationError", () => {
  it("adds profile hint for API key errors", () => {
    expect(formatVideoGenerationError("Invalid API key")).toContain("Profile");
  });

  it("returns the base message when no special case applies", () => {
    expect(formatVideoGenerationError("Celebrity detected")).toBe(
      "Celebrity detected"
    );
  });
});
