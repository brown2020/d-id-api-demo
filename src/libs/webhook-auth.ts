import { createHmac, timingSafeEqual } from "crypto";

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export function webhookTokenMatches(token: string | null, secret: string): boolean {
  if (!token || !secret) {
    return false;
  }
  return safeEqual(token, secret);
}

export function webhookHmacMatches(
  rawBody: string,
  secret: string,
  signatureHeader: string
): boolean {
  if (!secret || !signatureHeader) {
    return false;
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signatureHeader);
}

/**
 * The query token is the secret embedded in the webhook URL we register.
 * A signature header is accepted as an alternate proof, but a header we do
 * not understand must not override a matching token.
 */
export function isWebhookAuthorized(
  rawBody: string,
  secret: string,
  token: string | null,
  signatureHeader: string | null
): boolean {
  if (!secret) {
    return false;
  }
  if (webhookTokenMatches(token, secret)) {
    return true;
  }
  if (signatureHeader && webhookHmacMatches(rawBody, secret, signatureHeader)) {
    return true;
  }
  return false;
}
