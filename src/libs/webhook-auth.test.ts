import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import { isWebhookAuthorized } from "@/libs/webhook-auth";

describe("isWebhookAuthorized", () => {
  const secret = "super-secret-token";
  const body = JSON.stringify({ id: "tlk_1", status: "done" });

  it("accepts the query token", () => {
    expect(isWebhookAuthorized(body, secret, secret, null)).toBe(true);
  });

  it("rejects a missing or wrong token when no valid signature is present", () => {
    expect(isWebhookAuthorized(body, secret, null, null)).toBe(false);
    expect(isWebhookAuthorized(body, secret, "nope", null)).toBe(false);
    expect(isWebhookAuthorized(body, secret, "nope", "deadbeef")).toBe(false);
  });

  it("does not let an unrecognized signature header override a valid token", () => {
    expect(isWebhookAuthorized(body, secret, secret, "not-our-format")).toBe(true);
  });

  it("accepts an HMAC of the body when the token is absent", () => {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(isWebhookAuthorized(body, secret, null, signature)).toBe(true);
  });
});
