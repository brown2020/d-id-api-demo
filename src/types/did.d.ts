import { FabricImage } from "fabric";
import * as fabric from "fabric";

export interface DIDTalkingPhoto {
  talking_photo_id: string;
  talking_photo_name: string;
  preview_image_url: string;
  favorite_of?: string[];
  project?: string;
  voiceId?: string;
  type?: string;
  owner?: string;
  presenter_id?: string;
  created_at?: number;
}

export type Emotion = "neutral" | "happy" | "surprise" | "serious";
export type Movement = "neutral" | "lively";
export type Frame = "landscape" | "square" | "portrait" | "fit";

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
  accent: string;
  language: string;
  preview_url: string;
  voice_id?: string;
};

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

export type DIDVideoStatus =
  | "created"
  | "done"
  | "error"
  | "started"
  | "rejected";

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
  errorMessage?: string;
  error?: Record<string, unknown>;
  thumbnail_url?: string;
  demo_mode?: boolean;
  demo_notice?: string;
};

export type ExpressiveAvatar = {
  id: string;
  name: string;
  thumbnail_url: string;
  provider_details: {
    provider: string;
    voice_id?: string;
  };
  sentiments: ExpressiveSentiment[];
};

export type ExpressiveSentiment = {
  id: string;
  name: string;
  thumbnail_url: string;
  voice: {
    type: string;
    voice_id?: string;
  };
};

export type ExpressiveVideoStatus = "created" | "processing" | "done" | "error";

export type ExpressiveVideoDetail = {
  id: string;
  object: string;
  status: ExpressiveVideoStatus;
  avatar_id: string;
  sentiment_id: string;
  result_url?: string;
  duration?: number;
  created_at: string;
  owner?: string;
  thumbnail_url?: string;
  errorMessage?: string;
  script_text?: string;
  demo_mode?: boolean;
  demo_notice?: string;
};

export type Agent = {
  id: string;
  preview_name?: string;
  presenter: {
    type: string;
    presenter_id: string;
    voice: {
      type: string;
      voice_id: string;
    };
  };
  llm?: {
    type: string;
    model?: string;
    api_key?: string;
  };
  knowledge?: {
    provider: string;
    text: string;
  };
  created_at?: string;
  updated_at?: string;
};

export type AgentClientKey = {
  client_key: string;
  created_at: string;
  allowed_domains: string[];
};

export type NotificationType = "video_generated";
export type NotificationStatus = "unread" | "read";

export type NotificationDetail = {
  id?: string;
  type: NotificationType;
  created_at: number;
  status: NotificationStatus;
  video_id: string;
  user_id: string;
};

interface CustomFabricImage
  extends FabricImage<
    Partial<fabric.ImageProps>,
    fabric.SerializedImageProps,
    fabric.ObjectEvents
  > {
  is_avatar?: boolean; // Add a custom `id` property
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type CanvasObjects = any[];
type CanvasObject = {
  objects: CanvasObjects;
  background?: string;
  version: string;
};
