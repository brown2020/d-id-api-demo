"use server";

import { admin, adminDb } from "@/firebase/firebaseAdmin";
import { requireAuth } from "@/actions/auth";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { isCallerImagePath, isVideoThumbnailPath } from "@/libs/storage-url";

const SIGNED_URL_TTL_MS = 60 * 60 * 1000;

async function canReadPath(filepath: string, uid: string): Promise<boolean> {
  if (filepath.includes("..") || filepath.includes("\\") || filepath.startsWith("/")) {
    return false;
  }

  if (isCallerImagePath(filepath, uid)) {
    return true;
  }

  const thumbnail = filepath.match(/^video-image\/([^/]+)\//);
  if (!thumbnail || !isVideoThumbnailPath(filepath, thumbnail[1])) {
    return false;
  }

  const video = await adminDb.collection(VIDEO_COLLECTION).doc(thumbnail[1]).get();
  return video.exists && video.data()?.owner === uid;
}

export async function getFileUrl(filepath: string) {
  const uid = await requireAuth();

  if (!(await canReadPath(filepath, uid))) {
    throw new Error("Forbidden");
  }

  const file = admin.storage().bucket().file(filepath);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + SIGNED_URL_TTL_MS,
  });
  return url;
}
