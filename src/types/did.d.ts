export interface DIDTalkingPhoto {
  talking_photo_id: string;
  talking_photo_name: string;
  preview_image_url: string;
  favorite?: boolean;
  project?: string;
  voiceId?: string;
  type?: string;
  owner?: string;
}

export type Emotion = 'natural' | 'happy' | 'surprised' | 'serious';
export type Movement = 'natural' | 'lively';

export interface CreateVideoForm {
  talking_photo_id: string;
  script: string;
  voice_id: string;
  emotion: Emotion;
  movement: Movement;
}

export type AvatarValues = {
  voiceId: string;
  name: string;
  preview_image_url: string;
  talking_photo_id: string;
};

export type AudioDetails = {
  voice_id: string;
  name: string;
  accent: string;
  gender: string;
  age: string;
  descriptive: string;
  language: string;
  preview_url: string;
  public_owner_id?: string,
  description?: string,
  category?: string,
  use_case?: string,
  date_unix?: number,
  usage_character_count_1y?: number,
  usage_character_count_7d?: number,
  play_api_usage_character_count_1y?: number,
  cloned_by_count?: number,
  rate?: number,
  free_users_allowed?: boolean,
  notice_period?: boolean,
  live_moderation_enabled?: boolean,
  featured?: boolean,
  instagram_username?: string | null,
  twitter_username?: string | null,
  youtube_username?: string | null,
  tiktok_username?: string | null,
  image_url?: string
}