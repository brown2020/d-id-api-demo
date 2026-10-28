import { describe, expect, it } from "vitest";

import {
  isCallerImagePath,
  isExactFallbackImageUrl,
  isOwnedVideoObjectPath,
  isVideoThumbnailPath,
  sniffImageContentType,
  storageObjectPathFromUrl,
} from "@/libs/storage-url";

const BUCKET = "demo.appspot.com";

describe("storageObjectPathFromUrl", () => {
  it("reads a GCS signed URL and ignores the query string", () => {
    const raw = `https://storage.googleapis.com/${BUCKET}/images/uid/avatar/a.png?X-Goog-Algorithm=GOOG4`;
    expect(storageObjectPathFromUrl(raw, BUCKET)).toBe("images/uid/avatar/a.png");
  });

  it("reads a Firebase download URL", () => {
    const raw = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent("images/uid/a.png")}?alt=media&token=abc`;
    expect(storageObjectPathFromUrl(raw, BUCKET)).toBe("images/uid/a.png");
  });

  it("rejects other hosts, buckets, and traversal", () => {
    expect(storageObjectPathFromUrl("http://169.254.169.254/latest", BUCKET)).toBeNull();
    expect(
      storageObjectPathFromUrl("https://storage.googleapis.com/other/images/uid/a.png", BUCKET)
    ).toBeNull();
    const normalized = storageObjectPathFromUrl(
      `https://storage.googleapis.com/${BUCKET}/images/uid/../../secret`,
      BUCKET
    );
    expect(isCallerImagePath(normalized ?? "", "uid")).toBe(false);
    expect(
      storageObjectPathFromUrl(`https://storage.googleapis.com/${BUCKET}/../../evil`, BUCKET)
    ).toBeNull();
    expect(storageObjectPathFromUrl("https://evil.example/a.png", BUCKET)).toBeNull();
  });
});

describe("path ownership", () => {
  it("allows only the caller prefix", () => {
    expect(isCallerImagePath("images/user-1/a.png", "user-1")).toBe(true);
    expect(isCallerImagePath("images/user-2/a.png", "user-1")).toBe(false);
    expect(isCallerImagePath("videos/user-1/a.mp4", "user-1")).toBe(false);
  });

  it("binds thumbnails and videos to the document id", () => {
    expect(isVideoThumbnailPath("video-image/vid/thumb.png", "vid")).toBe(true);
    expect(isVideoThumbnailPath("video-image/other/thumb.png", "vid")).toBe(false);
    expect(isOwnedVideoObjectPath("videos/vid.mp4", "vid")).toBe(true);
    expect(isOwnedVideoObjectPath("videos/other.mp4", "vid")).toBe(false);
  });
});

describe("image sniffing", () => {
  it("recognizes png and rejects html", () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(sniffImageContentType(png)).toBe("image/png");
    expect(sniffImageContentType(Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c]))).toBeNull();
  });

  it("matches only the exact fallback asset", () => {
    expect(isExactFallbackImageUrl("https://didapidemo.vercel.app/assets/headshot_fallback.png")).toBe(true);
    expect(isExactFallbackImageUrl("https://didapidemo.vercel.app/assets/other.png")).toBe(false);
    expect(isExactFallbackImageUrl("https://evil.example/assets/headshot_fallback.png")).toBe(false);
  });
});
