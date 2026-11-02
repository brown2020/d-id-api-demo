import { AUDIO_LIST, AVATAR_TYPE_TEMPLATE } from "@/libs/constants";
import { SAMPLE_TALKING_AVATAR_IMAGE } from "@/libs/did-demo";
import type { DIDTalkingPhoto } from "@/types/did";

export const DEMO_AVATAR_ID = "demo-sample-avatar";

export const DEMO_AVATAR_CREATE_NOTICE =
  "Demo mode: no D-ID key is configured. You can save this avatar, and generated videos use the bundled sample.";

export const DEMO_VOICES_NOTICE =
  "Demo mode: showing built-in voices because a voice provider is not available.";

export type FallbackVoice = {
  voiceId: string;
  name: string;
  previewUrl: string;
  labels: {
    accent?: string;
    description?: string;
    age?: string;
    gender?: string;
    use_case?: string;
    language?: string;
  };
};

type AudioListEntry = {
  voice_id: string;
  name: string;
  preview_url: string;
  language?: string;
  labels?: FallbackVoice["labels"];
};

/** Static voices used when ElevenLabs or D-ID cannot return a list. */
export function fallbackVoices(): FallbackVoice[] {
  return (AUDIO_LIST as AudioListEntry[]).map((voice) => ({
    voiceId: voice.voice_id,
    name: voice.name,
    previewUrl: voice.preview_url,
    labels: {
      ...voice.labels,
      language: voice.language,
    },
  }));
}

export function defaultFallbackVoice(): FallbackVoice {
  const voices = fallbackVoices();
  const first = voices[0];
  if (!first) {
    throw new Error("The bundled voice list is empty.");
  }
  return first;
}

export function builtinDemoAvatar(): DIDTalkingPhoto {
  const voice = defaultFallbackVoice();
  return {
    talking_photo_id: DEMO_AVATAR_ID,
    talking_photo_name: "Demo Avatar",
    preview_image_url: SAMPLE_TALKING_AVATAR_IMAGE,
    voiceId: voice.voiceId,
    type: AVATAR_TYPE_TEMPLATE,
    favorite_of: [],
    owner: "",
    presenter_id: "",
  };
}

export function isBuiltinDemoAvatar(id: string | null | undefined): boolean {
  return id === DEMO_AVATAR_ID;
}

export function profileHasDidKey(
  didApiKey: string | null | undefined,
  basicAuth: string | null | undefined
): boolean {
  return Boolean(didApiKey?.trim() || basicAuth?.trim());
}

/** Ensures the gallery is not empty when the profile has no D-ID key. */
export function withBuiltinDemoAvatar(
  avatars: DIDTalkingPhoto[],
  hasDidKey: boolean
): DIDTalkingPhoto[] {
  if (hasDidKey) {
    return avatars;
  }
  if (avatars.some((avatar) => avatar.talking_photo_id === DEMO_AVATAR_ID)) {
    return avatars;
  }
  return [builtinDemoAvatar(), ...avatars];
}

export function avatarPreviewSrc(
  avatar: {
    talking_photo_id: string;
    preview_image_url?: string;
  },
  options?: { hasDidKey?: boolean }
): string {
  if (
    isBuiltinDemoAvatar(avatar.talking_photo_id) ||
    avatar.preview_image_url?.startsWith("/demo/")
  ) {
    return avatar.preview_image_url || SAMPLE_TALKING_AVATAR_IMAGE;
  }
  const stored = avatar.preview_image_url?.trim() ?? "";
  if (options?.hasDidKey) {
    return `/api/imageproxy/${avatar.talking_photo_id}.png`;
  }
  return stored;
}

export function isAvatarCardSelected(
  selectedId: string | null | undefined,
  avatarId: string
): boolean {
  return Boolean(selectedId) && selectedId === avatarId;
}

/**
 * Prefer the avatar stored on the profile. With no key and no match, use the
 * built-in demo avatar. Wait for the photo list before dropping a real id.
 */
export function resolveGallerySelection(
  avatars: DIDTalkingPhoto[],
  selectedId: string | null | undefined,
  hasDidKey: boolean,
  photosLoaded: boolean
): DIDTalkingPhoto | null {
  const id = selectedId?.trim() ?? "";
  if (id) {
    const match = avatars.find((avatar) => avatar.talking_photo_id === id);
    if (match) {
      return match;
    }
    if (!photosLoaded) {
      return null;
    }
  }
  if (!hasDidKey) {
    return (
      avatars.find((avatar) => isBuiltinDemoAvatar(avatar.talking_photo_id)) ??
      builtinDemoAvatar()
    );
  }
  return null;
}

/** Same gate the create-video screen uses to enable Generate. */
export function canEnableGenerate(
  avatar: { voiceId?: string } | null,
  voice: { voiceId?: string } | null
): boolean {
  return Boolean(
    avatar && voice && avatar.voiceId && avatar.voiceId === voice.voiceId
  );
}

/** Draw whenever an avatar is selected, including a gallery-only demo avatar. */
export function shouldDrawSelectedAvatar(input: {
  hasUser: boolean;
  selectedAvatarId: string | null | undefined;
  canvasReady: boolean;
}): boolean {
  return Boolean(input.hasUser && input.selectedAvatarId && input.canvasReady);
}

/**
 * Canvas image for the selected avatar.
 * The built-in demo stays on the public file. Every other avatar is loaded
 * from the same-origin image proxy so Fabric can use crossOrigin without
 * reading a signed Storage URL. A D-ID key is not required.
 */
export function canvasAvatarImageUrl(
  avatar: { talking_photo_id: string; preview_image_url?: string },
  options: { origin: string }
): string {
  const origin = options.origin.replace(/\/$/, "");
  if (
    isBuiltinDemoAvatar(avatar.talking_photo_id) ||
    avatar.preview_image_url?.startsWith("/demo/")
  ) {
    const preview = avatar.preview_image_url?.trim() || SAMPLE_TALKING_AVATAR_IMAGE;
    return preview.startsWith("/") ? `${origin}${preview}` : preview;
  }
  return `${origin}/api/imageproxy/${encodeURIComponent(avatar.talking_photo_id)}.png`;
}

/** Turn a Fabric image failure into text. Empty objects must not render as "{}". */
export function formatCanvasImageError(err: unknown): string {
  const readable = readCanvasErrorText(err);
  if (!readable || readable === "{}") {
    return "Could not load this avatar image.";
  }
  return readable;
}

function readCanvasErrorText(err: unknown): string {
  if (typeof err === "string") {
    return err.trim();
  }
  if (!err || typeof err !== "object") {
    return "";
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }
  const record = err as { data?: unknown; message?: unknown };
  if (typeof record.message === "string" && record.message.trim() && record.message.trim() !== "{}") {
    return record.message.trim();
  }
  return readCanvasErrorText(record.data);
}

/**
 * A missing draft id blocks a live D-ID submit.
 * With no key, generateVideo still accepts a null id and returns the sample.
 */
export function missingVideoIdBlocksGenerate(
  videoId: string | null | undefined,
  hasDidKey: boolean
): boolean {
  return !videoId && hasDidKey;
}

export function talkingPhotoSelection(id: string): {
  selectedTalkingPhoto: string;
} {
  return { selectedTalkingPhoto: id };
}
