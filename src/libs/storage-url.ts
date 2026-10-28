export const FALLBACK_HEADSHOT_URL =
  "https://didapidemo.vercel.app/assets/headshot_fallback.png";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function maxProxiedImageBytes(): number {
  return MAX_IMAGE_BYTES;
}

export function isExactFallbackImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      url.hostname === "didapidemo.vercel.app" &&
      url.pathname === "/assets/headshot_fallback.png"
    );
  } catch {
    return false;
  }
}

function sanitizeObjectPath(path: string): string | null {
  if (!path || path.startsWith("/") || path.includes("..") || path.includes("\\") || path.includes("\0")) {
    return null;
  }
  return path;
}

/**
 * Returns the object path when `raw` is an HTTPS URL for `bucket`.
 * Query credentials are ignored so expired signed URLs still identify the object.
 */
export function storageObjectPathFromUrl(
  raw: string,
  bucket: string
): string | null {
  if (!bucket) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.username !== "" || url.password !== "") {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (host === "storage.googleapis.com") {
    const prefix = `/${bucket}/`;
    if (!url.pathname.startsWith(prefix)) {
      return null;
    }
    return sanitizeObjectPath(decodeURIComponent(url.pathname.slice(prefix.length)));
  }

  if (host === "firebasestorage.googleapis.com") {
    const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
    if (!match) {
      return null;
    }
    let bucketName: string;
    let objectPath: string;
    try {
      bucketName = decodeURIComponent(match[1]);
      objectPath = decodeURIComponent(match[2]);
    } catch {
      return null;
    }
    if (bucketName !== bucket) {
      return null;
    }
    return sanitizeObjectPath(objectPath);
  }

  return null;
}

export function isCallerImagePath(objectPath: string, uid: string): boolean {
  if (!uid || uid.includes("/") || uid.includes("..")) {
    return false;
  }
  return sanitizeObjectPath(objectPath)?.startsWith(`images/${uid}/`) ?? false;
}

export function isVideoThumbnailPath(objectPath: string, videoId: string): boolean {
  if (!videoId || videoId.includes("/") || videoId.includes("..")) {
    return false;
  }
  return (
    sanitizeObjectPath(objectPath)?.startsWith(`video-image/${videoId}/`) ?? false
  );
}

export function isOwnedVideoObjectPath(objectPath: string, videoId: string): boolean {
  if (!videoId || videoId.includes("/") || videoId.includes("..")) {
    return false;
  }
  const safe = sanitizeObjectPath(objectPath);
  if (!safe) {
    return false;
  }
  return safe === `videos/${videoId}.mp4` || safe.startsWith(`videos/${videoId}/`);
}

/** Sniff raster image bytes. SVG and HTML are rejected. */
export function sniffImageContentType(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function safeImageResponseHeaders(contentType: string): Record<string, string> {
  return {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
    "Content-Disposition": "inline",
  };
}
