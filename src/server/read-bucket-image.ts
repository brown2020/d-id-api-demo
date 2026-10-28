import { adminBucket } from "@/firebase/firebaseAdmin";
import {
  maxProxiedImageBytes,
  sniffImageContentType,
} from "@/libs/storage-url";

export type BucketImage =
  | { ok: true; bytes: Buffer; contentType: string }
  | { ok: false; status: number };

export async function readBucketImage(objectPath: string): Promise<BucketImage> {
  try {
    const file = adminBucket.file(objectPath);
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size ?? 0);
    if (!Number.isFinite(size) || size <= 0 || size > maxProxiedImageBytes()) {
      return { ok: false, status: 404 };
    }

    const [bytes] = await file.download();
    if (bytes.length > maxProxiedImageBytes()) {
      return { ok: false, status: 404 };
    }

    const contentType = sniffImageContentType(bytes);
    if (!contentType) {
      return { ok: false, status: 404 };
    }

    return { ok: true, bytes, contentType };
  } catch {
    return { ok: false, status: 404 };
  }
}
