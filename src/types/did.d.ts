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

export interface CreateVideoForm {
  talking_photo_id: string;
  script: string;
  voice_id: string;
  emotion: Emotion;
  lively: boolean;
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
}