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
  value: string;
  label: string;
  name: string;
  labels: {
    accent: string;
    description: string;
    age: string;
    gender: string;
    use_case: string;
  };
  voice_verification: Record<string, null | boolean | never | number>;
  fine_tuning: Record<string, null | boolean | never | number>;
  accent: string;
  voice_id?: string;
  gender?: string;
  age?: string;
  descriptive?: string;
  use_case?: string;
  language?: string;
}

interface FineTuningState {
  eleven_multilingual_v2: string;
  eleven_turbo_v2_5: string;
  eleven_turbo_v2: string;
}

interface AudioFullDetails {
  voice_id: string;
  name: string;
  samples: string | null;
  category: string;
  fine_tuning: {
    is_allowed_to_fine_tune: boolean;
    state: Record<string, string>;
    verification_attempts_count: number;
    manual_verification_requested: boolean;
    language: string;
    progress: Record<string, unknown>;
    message: Record<string, string>;
    dataset_duration_seconds: number | null;
  };
  labels: {
    accent: string;
    description: string | null;
    age: string;
    gender: string;
    use_case: string;
  };
  description: string | null;
  preview_url: string;
  high_quality_base_model_ids: string[];
  voice_verification: {
    requires_verification: boolean;
    is_verified: boolean;
    verification_attempts_count: number;
    language: string | null;
  };
  is_owner: boolean;
  is_legacy: boolean;
  is_mixed: boolean;
  accent: string;
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