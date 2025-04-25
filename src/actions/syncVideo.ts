"use server";

import { DIDVideoStatus } from "../types/did";
import { VIDEO_COLLECTION, NOTIFICATION_COLLECTION } from "../libs/constants";
import { adminDb } from "../firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

interface SyncVideoParams {
  video_id: string;
  owner: string;
  video_url: string;
  status?: DIDVideoStatus;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
}

// Define a more specific type for the update data
interface VideoUpdateData {
  video_url: string;
  d_id_status: DIDVideoStatus;
  updated_at: Timestamp;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
}

export async function syncVideo(params: SyncVideoParams) {
  try {
    const {
      video_id,
      owner,
      video_url,
      status = "done",
      errorMessage,
      errorDetails,
    } = params;

    // Get the video document reference
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(video_id);

    // Create an update object, only including fields that are defined
    const updateData: Partial<VideoUpdateData> = {
      video_url,
      d_id_status: status,
      updated_at: Timestamp.now(),
    };

    // Only add error fields if they're defined
    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    if (errorDetails !== undefined) {
      updateData.errorDetails = errorDetails;
    }

    // Update the video document with only defined fields
    await videoRef.update(updateData);

    // Create notification
    await adminDb.collection(NOTIFICATION_COLLECTION).add({
      user_id: owner,
      video_id,
      status: "UNREAD",
      type: status === "done" ? "video_generated" : "video_generation_failed",
      created_at: Timestamp.now(),
    });

    return { success: true, video_url };
  } catch (error) {
    console.error("Error syncing video:", error);
    return { error: "Failed to sync video" };
  }
}
