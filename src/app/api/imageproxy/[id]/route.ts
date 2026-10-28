import { NextResponse } from "next/server";

import { adminDb } from "@/firebase/firebaseAdmin";
import { DOCUMENT_COLLECTION } from "@/libs/constants";
import {
  isCallerImagePath,
  isExactFallbackImageUrl,
  safeImageResponseHeaders,
  sniffImageContentType,
  storageObjectPathFromUrl,
  maxProxiedImageBytes,
} from "@/libs/storage-url";
import { readBucketImage } from "@/server/read-bucket-image";

export const dynamic = "force-dynamic";

function unavailable(status = 404) {
  return NextResponse.json(
    { error: "Image not available" },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

async function serveFallback() {
  try {
    const response = await fetch(
      "https://didapidemo.vercel.app/assets/headshot_fallback.png",
      { redirect: "error" }
    );
    if (!response.ok) {
      return unavailable();
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxProxiedImageBytes()) {
      return unavailable();
    }
    const contentType = sniffImageContentType(bytes);
    if (!contentType) {
      return unavailable();
    }
    return new NextResponse(bytes, { headers: safeImageResponseHeaders(contentType) });
  } catch {
    return unavailable();
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const docId = id.replace(/\.png$/, "");

  try {
    const docSnap = await adminDb.collection(DOCUMENT_COLLECTION).doc(docId).get();
    if (!docSnap.exists) {
      return unavailable();
    }

    const data = docSnap.data();
    const imageUrl = data?.preview_image_url;
    if (typeof imageUrl !== "string" || !imageUrl) {
      return unavailable();
    }

    if (isExactFallbackImageUrl(imageUrl)) {
      return serveFallback();
    }

    const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET ?? "";
    const objectPath = storageObjectPathFromUrl(imageUrl, bucket);
    const owner = typeof data?.owner === "string" ? data.owner : "";
    if (!objectPath || !isCallerImagePath(objectPath, owner)) {
      return unavailable();
    }

    const image = await readBucketImage(objectPath);
    if (!image.ok) {
      return unavailable(image.status);
    }

    return new NextResponse(new Uint8Array(image.bytes), {
      headers: safeImageResponseHeaders(image.contentType),
    });
  } catch {
    return unavailable(500);
  }
}
