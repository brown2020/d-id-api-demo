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

// Type error: Type '{ value: string; label: string; name: string; labels: { accent: string; description: string; age: string; gender: string; use_case: string; } | { accent: string; description: string; age: string; gender: string; use_case: string; } | { ...; } | { ...; } | { ...; }; voice_verification: { ...; } | ... 3 more ... | { ....' is not assignable to type 'AudioDetails[]'.
// Type '{ value: string; label: string; name: string; labels: { accent: string; description: string; age: string; gender: string; use_case: string; } | { accent: string; description: string; age: string; gender: string; use_case: string; } | { ...; } | { ...; } | { ...; }; voice_verification: { ...; } | ... 3 more ... | { ....' is not assignable to type 'AudioDetails'.
//   Types of property 'voice_verification' are incompatible.
//     Type '{ requires_verification: boolean; is_verified: boolean; verification_failures: never[]; verification_attempts_count: number; language: null; verification_attempts: null; } | { requires_verification: boolean; ... 4 more ...; verification_attempts: null; } | { ...; } | { ...; } | { ...; }' is not assignable to type '{ verified?: boolean | undefined; verification_date?: string | undefined; }'.
//       Type '{ requires_verification: boolean; is_verified: boolean; verification_failures: never[]; verification_attempts_count: number; language: null; verification_attempts: null; }' has no properties in common with type '{ verified?: boolean | undefined; verification_date?: string | undefined; }'

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
  voice_verification: {
    verified?: boolean;
    verification_failures: never[];
    verification_attempts_count: number;
    language?: null;
    verification_attempts: null;
  };
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
    verification_failures: any[];
    verification_attempts_count: number;
    manual_verification_requested: boolean;
    language: string;
    progress: Record<string, unknown>;
    message: Record<string, string>;
    dataset_duration_seconds: number | null;
    verification_attempts: any[] | null;
    slice_ids: any[] | null;
    manual_verification: any | null;
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
  available_for_tiers: any[];
  settings: any | null;
  sharing: any | null;
  high_quality_base_model_ids: string[];
  safety_control: any | null;
  voice_verification: {
    requires_verification: boolean;
    is_verified: boolean;
    verification_failures: any[];
    verification_attempts_count: number;
    language: string | null;
    verification_attempts: any[] | null;
  };
  permission_on_resource: any | null;
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