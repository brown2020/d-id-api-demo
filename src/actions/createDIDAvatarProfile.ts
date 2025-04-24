"use server";

import { getCurrentUser } from "./getCurrentUser";
import { DIDTalkingPhoto } from "@/types/did";

// Response types
type CreateAvatarSuccess = {
  status: true;
  avatar: DIDTalkingPhoto;
};

type CreateAvatarError = {
  status: false;
  error: string;
};

type CreateAvatarResponse = CreateAvatarSuccess | CreateAvatarError;

/**
 * Creates a talking photo profile in Firebase
 * No D-ID validation is done at this stage - validation happens later when creating videos
 */
export async function createDIDAvatarProfile(
  d_id_api_key: string, // Not used in this function, but kept for compatibility
  name: string,
  imageUrl: string,
  voiceId: string,
  avatarId: string,
  ownerId: string
): Promise<CreateAvatarResponse> {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return {
        status: false,
        error: "Unauthorized",
      };
    }

    // Create DIDTalkingPhoto object without D-ID API validation
    const avatar: DIDTalkingPhoto = {
      talking_photo_id: avatarId,
      talking_photo_name: name,
      preview_image_url: imageUrl,
      presenter_id: "", // Empty presenter_id - will be populated when used with D-ID
      favorite_of: [],
      type: "personal",
      voiceId: voiceId,
      owner: ownerId,
      created_at: Date.now(),
    };

    return {
      status: true,
      avatar,
    };
  } catch (error) {
    console.error("Error creating avatar profile:", error);
    return {
      status: false,
      error: "An unexpected error occurred while creating your avatar.",
    };
  }
}
