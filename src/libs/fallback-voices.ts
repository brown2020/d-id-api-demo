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

export function avatarPreviewSrc(avatar: {
  talking_photo_id: string;
  preview_image_url?: string;
}): string {
  if (
    isBuiltinDemoAvatar(avatar.talking_photo_id) ||
    avatar.preview_image_url?.startsWith("/demo/")
  ) {
    return avatar.preview_image_url || SAMPLE_TALKING_AVATAR_IMAGE;
  }
  return `/api/imageproxy/${avatar.talking_photo_id}.png`;
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
