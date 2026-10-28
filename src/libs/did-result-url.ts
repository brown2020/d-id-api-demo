const MAX_DID_RESULT_BYTES = 100 * 1024 * 1024;

/** D-ID publishes finished talks on its own S3 buckets (virtual-hosted style). */
const DID_S3_HOST =
  /^d-id-[a-z0-9-]+\.s3(?:\.[a-z0-9-]+)?\.amazonaws\.com$/;

export function maxDidResultBytes(): number {
  return MAX_DID_RESULT_BYTES;
}

export function isAllowedDidResultUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  if (url.protocol !== "https:" || url.username !== "" || url.password !== "") {
    return false;
  }

  const host = url.hostname.toLowerCase();
  if (DID_S3_HOST.test(host)) {
    return true;
  }

  // Path-style: https://s3.us-west-2.amazonaws.com/d-id-talks-prod/...
  if (/^s3(?:\.[a-z0-9-]+)?\.amazonaws\.com$/.test(host)) {
    const firstSegment = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return firstSegment.startsWith("d-id-");
  }

  return false;
}
