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

export type Emotion = 'neutral' | 'happy' | 'surprise' | 'serious';
export type Movement = 'neutral' | 'lively';

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
  label: string;
  name: string;
  accent: string;
  gender: string;
  age: string;
  descriptive: string;
  language: string;
  preview_url: string;
  labels: {
    gender: string
  },
  voice_verification: {
    language: string;
  }
}

export type DIDVideoStatus = 'created' | 'done' | 'error' | 'started' | 'rejected';

export type VideoDetail = {
  id: string;
  did_id: string;
  title: string;
  avatar_id?: string;
  type: "personal" | "template";
  video_url?: string;
  owner: string;
  d_id_status: DIDVideoStatus;
  created_at: number;
}

export type NotificationType = 'video_generated'
export type NotificationStatus = 'unread' | 'read';

export type NotificationDetail = {
  id?: string;
  type: NotificationType;
  created_at: number;
  status: NotificationStatus,
  video_id: string,
  user_id: string,
}