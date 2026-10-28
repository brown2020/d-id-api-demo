import { describe, expect, it } from "vitest";

import { isAllowedDidResultUrl } from "@/libs/did-result-url";

describe("isAllowedDidResultUrl", () => {
  it("allows D-ID S3 result hosts", () => {
    expect(
      isAllowedDidResultUrl(
        "https://d-id-talks-prod.s3.us-west-2.amazonaws.com/auth0%7Cabc/talk.mp4?X-Amz-Signature=1"
      )
    ).toBe(true);
    expect(
      isAllowedDidResultUrl(
        "https://s3.us-west-2.amazonaws.com/d-id-talks-prod/talk.mp4"
      )
    ).toBe(true);
  });

  it("rejects metadata, arbitrary hosts, and non-HTTPS URLs", () => {
    expect(isAllowedDidResultUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedDidResultUrl("https://evil.example/video.mp4")).toBe(false);
    expect(isAllowedDidResultUrl("https://s3.us-west-2.amazonaws.com/other-bucket/a.mp4")).toBe(false);
    expect(isAllowedDidResultUrl("https://user:pass@d-id-talks-prod.s3.us-west-2.amazonaws.com/a.mp4")).toBe(false);
  });
});
