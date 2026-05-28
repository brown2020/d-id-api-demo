import { describe, expect, it } from "vitest";

import {
  EDITABLE_VIDEO_STATUSES,
  getSafeCallbackUrl,
  isEditableVideoStatus,
  isProtectedPathname,
  PROTECTED_PATH_PREFIXES,
} from "@/libs/auth-constants";

describe("isProtectedPathname", () => {
  it("protects core authenticated routes", () => {
    expect(isProtectedPathname("/profile")).toBe(true);
    expect(isProtectedPathname("/avatars")).toBe(true);
    expect(isProtectedPathname("/generate")).toBe(true);
    expect(isProtectedPathname("/payment-attempt")).toBe(true);
    expect(isProtectedPathname("/payment-success")).toBe(true);
  });

  it("protects video routes", () => {
    expect(isProtectedPathname("/videos")).toBe(true);
    expect(isProtectedPathname("/videos/create")).toBe(true);
    expect(isProtectedPathname("/videos/abc/show")).toBe(true);
    expect(isProtectedPathname("/videos/abc/edit")).toBe(true);
  });

  it("leaves public routes accessible", () => {
    expect(isProtectedPathname("/")).toBe(false);
    expect(isProtectedPathname("/diagnostic")).toBe(false);
    expect(isProtectedPathname("/api-diagnostics")).toBe(false);
    expect(isProtectedPathname("/ngrok-setup")).toBe(false);
  });

  it("does not over-match similar prefixes", () => {
    expect(isProtectedPathname("/video")).toBe(false);
    expect(isProtectedPathname("/profile-settings")).toBe(false);
  });

  it("matches all configured prefixes", () => {
    for (const prefix of PROTECTED_PATH_PREFIXES) {
      expect(isProtectedPathname(prefix)).toBe(true);
    }
  });
});

describe("getSafeCallbackUrl", () => {
  it("accepts same-origin relative paths", () => {
    expect(getSafeCallbackUrl("/videos")).toBe("/videos");
    expect(getSafeCallbackUrl("/videos/abc/show")).toBe("/videos/abc/show");
  });

  it("rejects external and protocol-relative URLs", () => {
    expect(getSafeCallbackUrl("https://evil.example")).toBeNull();
    expect(getSafeCallbackUrl("//evil.example")).toBeNull();
    expect(getSafeCallbackUrl("/\\evil")).toBeNull();
    expect(getSafeCallbackUrl(null)).toBeNull();
    expect(getSafeCallbackUrl("")).toBeNull();
  });
});

describe("isEditableVideoStatus", () => {
  it("allows draft-like statuses", () => {
    for (const status of EDITABLE_VIDEO_STATUSES) {
      expect(isEditableVideoStatus(status)).toBe(true);
    }
  });

  it("blocks completed or in-flight generation", () => {
    expect(isEditableVideoStatus("done")).toBe(false);
    expect(isEditableVideoStatus("processing")).toBe(false);
  });
});
