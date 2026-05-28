type VideoStatusFields = {
  d_id_status?: string | null;
  video_url?: string | null;
};

/** True when the video is still being generated and has no playable URL yet. */
export function isVideoProcessing(video: VideoStatusFields): boolean {
  if (video.video_url) {
    return false;
  }

  const status = video.d_id_status ?? "";

  if (status === "error" || status === "done") {
    return false;
  }

  return true;
}

/** Builds a user-facing error string with optional profile/diagnostics hints. */
export function formatVideoGenerationError(message: string): string {
  const normalized = message.trim() || "An error occurred during video generation.";

  if (
    normalized.toLowerCase().includes("api key") ||
    normalized.toLowerCase().includes("unauthorized") ||
    normalized.toLowerCase().includes("authentication")
  ) {
    return `${normalized} Check your keys in Profile or visit /api-diagnostics.`;
  }

  if (
    normalized.toLowerCase().includes("image") ||
    normalized.toLowerCase().includes("accessible")
  ) {
    return `${normalized} Try /test-image-access or enable the fallback image option.`;
  }

  return normalized;
}
