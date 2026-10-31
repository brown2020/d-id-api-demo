/** Bundled stand-in used when D-ID cannot run a live talk. */

export const SAMPLE_TALKING_AVATAR_VIDEO = "/demo/sample-talking-avatar.mp4";
export const SAMPLE_TALKING_AVATAR_IMAGE = "/demo/sample-talking-avatar.png";

export const DEMO_MODE_NO_KEY_NOTICE =
  "Demo mode: showing a sample video because no D-ID key is configured";

export const DEMO_MODE_AUTH_NOTICE =
  "Demo mode: showing a sample video because D-ID rejected the API key.";

export const DEMO_MODE_QUOTA_NOTICE =
  "Demo mode: showing a sample video because the D-ID account is out of credits or quota.";

export type DidDemoReason = "missing_key" | "auth" | "credits" | "quota";

export type DidCredentials = {
  apiKey: string;
  basicAuth: string;
};

export type DidDemoSample = {
  demo: true;
  reason: DidDemoReason;
  notice: string;
  videoUrl: string;
  imageUrl: string;
};

const CREDIT_PATTERN =
  /\bcredits?\b|payment required|insufficient funds|out of credit/i;
const QUOTA_PATTERN = /\bquota\b|rate limit|too many requests/i;

export function demoNotice(reason: DidDemoReason): string {
  if (reason === "missing_key") {
    return DEMO_MODE_NO_KEY_NOTICE;
  }
  if (reason === "auth") {
    return DEMO_MODE_AUTH_NOTICE;
  }
  return DEMO_MODE_QUOTA_NOTICE;
}

export function demoSample(reason: DidDemoReason): DidDemoSample {
  return {
    demo: true,
    reason,
    notice: demoNotice(reason),
    videoUrl: SAMPLE_TALKING_AVATAR_VIDEO,
    imageUrl: SAMPLE_TALKING_AVATAR_IMAGE,
  };
}

/**
 * Profile credentials win. `DID_API_KEY` is used only when the profile has
 * neither an API key nor Basic Auth, so a server key can still call D-ID.
 */
export function resolveDidCredentials(
  apiKey: string | null | undefined,
  basicAuth: string | null | undefined,
  envApiKey?: string | null
): DidCredentials | null {
  const key = apiKey?.trim() ?? "";
  const basic = basicAuth?.trim() ?? "";
  if (key || basic) {
    return { apiKey: key, basicAuth: basic };
  }
  const envKey = envApiKey?.trim() ?? "";
  if (envKey) {
    return { apiKey: envKey, basicAuth: "" };
  }
  return null;
}

/**
 * True when a D-ID failure should be replaced with the bundled sample.
 * Credit and quota phrases win over an auth status.
 */
export function classifyDidDemoFallback(
  status: number | undefined,
  bodyText: string
): DidDemoReason | null {
  const text = bodyText.slice(0, 2000);
  if (status === 402 || CREDIT_PATTERN.test(text)) {
    return "credits";
  }
  if (status === 429 || QUOTA_PATTERN.test(text)) {
    return "quota";
  }
  if (status === 401 || status === 403) {
    return "auth";
  }
  return null;
}

export function isDidDemoSample(
  value: unknown
): value is DidDemoSample {
  return (
    typeof value === "object" &&
    value !== null &&
    "demo" in value &&
    (value as { demo?: unknown }).demo === true
  );
}
