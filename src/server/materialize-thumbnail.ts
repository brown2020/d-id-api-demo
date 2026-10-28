import { getFileUrl } from "@/actions/getFileUrl";
import { admin, adminDb } from "@/firebase/firebaseAdmin";
import { DOCUMENT_COLLECTION } from "@/libs/constants";
import {
  FALLBACK_HEADSHOT_URL,
  isCallerImagePath,
  isExactFallbackImageUrl,
  maxProxiedImageBytes,
  sniffImageContentType,
  storageObjectPathFromUrl,
} from "@/libs/storage-url";
import { readBucketImage } from "@/server/read-bucket-image";

async function saveThumbnail(videoId: string, bytes: Buffer, contentType: string) {
  const filePath = `video-image/${videoId}/thumbnail.png`;
  await admin.storage().bucket().file(filePath).save(bytes, {
    metadata: { contentType },
  });
  const storedUrl = await getFileUrl(filePath);
  return storedUrl;
}

export async function materializeVideoThumbnail(options: {
  thumbnailUrl: string;
  videoId: string;
  userId: string;
}): Promise<{ ok: true; storedUrl: string } | { ok: false; message: string }> {
  const { thumbnailUrl, videoId, userId } = options;

  if (isExactFallbackImageUrl(thumbnailUrl)) {
    return { ok: true, storedUrl: FALLBACK_HEADSHOT_URL };
  }

  if (thumbnailUrl.startsWith("data:")) {
    const matches = thumbnailUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return { ok: true, storedUrl: FALLBACK_HEADSHOT_URL };
    }

    const bytes = Buffer.from(matches[2], "base64");
    const contentType = sniffImageContentType(bytes);
    if (!contentType || bytes.length === 0 || bytes.length > maxProxiedImageBytes()) {
      return { ok: false, message: "Thumbnail image is not a supported image." };
    }

    const storedUrl = await saveThumbnail(videoId, bytes, contentType);
    return { ok: true, storedUrl };
  }

  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET ?? "";
  const objectPath = storageObjectPathFromUrl(thumbnailUrl, bucket);
  if (!objectPath) {
    return { ok: false, message: "Thumbnail image is not an allowed image." };
  }

  let allowed = isCallerImagePath(objectPath, userId);
  if (!allowed) {
    const parts = objectPath.split("/");
    if (parts[0] === "images" && parts.length >= 3) {
      const pathOwner = parts[1];
      const talkingId = parts[2];
      const avatar = await adminDb.collection(DOCUMENT_COLLECTION).doc(talkingId).get();
      const data = avatar.data();
      allowed = Boolean(
        avatar.exists &&
          data?.type === "template" &&
          data?.owner === pathOwner &&
          isCallerImagePath(objectPath, pathOwner)
      );
    }
  }

  if (!allowed) {
    return { ok: false, message: "Thumbnail image is not an allowed image." };
  }

  const image = await readBucketImage(objectPath);
  if (!image.ok) {
    return { ok: false, message: "Thumbnail image could not be read." };
  }

  const storedUrl = await saveThumbnail(videoId, image.bytes, image.contentType);
  return { ok: true, storedUrl };
}
