"use server";

import { DIDVideoStatus } from "../types/did";
import {
  NOTIFICATION_COLLECTION,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  VIDEO_COLLECTION,
} from "../libs/constants";
import { adminDb } from "../firebase/firebaseAdmin";
import { requireAuth } from "./auth";
import { Timestamp } from "firebase-admin/firestore";
import { isOwnedVideoObjectPath, storageObjectPathFromUrl } from "@/libs/storage-url";

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
  const userId = await requireAuth();
  try {
    const {
      video_id,
      video_url,
      status = "done",
      errorMessage,
      errorDetails,
    } = params;

    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(video_id);
    const existing = await videoRef.get();
    const existingData = existing.data();
    if (!existing.exists || !existingData || existingData.owner !== userId) {
      return { error: "Unauthorized" };
    }

    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET ?? "";
    const objectPath = storageObjectPathFromUrl(video_url, bucket);
    if (!objectPath || !isOwnedVideoObjectPath(objectPath, video_id)) {
      return { error: "Invalid video URL" };
    }

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
      user_id: existingData.owner,
      video_id,
      status: NOTIFICATION_STATUS.UNREAD,
      type:
        status === "done"
          ? NOTIFICATION_TYPE.VIDEO_GENERATED
          : NOTIFICATION_TYPE.VIDEO_GENERATION_FAILED,
      created_at: Math.floor(Date.now() / 1000).toString(),
    });

    return { success: true, video_url };
  } catch {
    return { error: "Failed to sync video" };
  }
}
