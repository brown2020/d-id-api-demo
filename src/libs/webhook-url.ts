/**
 * Returns true when the app base URL is reachable by D-ID for webhook callbacks.
 * Requires HTTPS and a non-localhost host.
 */
export function isPublicWebhookBaseUrl(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    const host = url.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.endsWith(".local")
    ) {
      return false;
    }

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Builds the D-ID webhook callback URL for a video document.
 * Returns null on localhost or non-HTTPS bases so callers fall back to polling.
 */
export function getWebhookUrl(
  baseUrl: string,
  videoId: string,
  secretToken: string
): string | null {
  if (!isPublicWebhookBaseUrl(baseUrl)) {
    return null;
  }

  const normalizedBase = baseUrl.replace(/\/$/, "");
  const encodedId = encodeURIComponent(videoId);
  const encodedToken = encodeURIComponent(secretToken);

  return `${normalizedBase}/api/video-generated/${encodedId}?token=${encodedToken}`;
}
