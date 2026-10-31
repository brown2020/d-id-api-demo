import { NextRequest, NextResponse } from "next/server";

import { addVideoToStorage } from "@/actions/addVideoToStorage";
import { addWebhookToHistory } from "@/actions/addWebhookToHistory";
import { adminDb } from "@/firebase/firebaseAdmin";
import {
  NOTIFICATION_COLLECTION,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  VIDEO_COLLECTION,
} from "@/libs/constants";
import { isWebhookAuthorized } from "@/libs/webhook-auth";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function recordWebhook(videoId: string, status: string) {
  await addWebhookToHistory(
    `video=${videoId} status=${status} at=${new Date().toISOString()}`
  );
}

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
  const { id } = await params;
  const rawBody = await req.text();

  let requestBody: Record<string, unknown> = {};
  if (req.headers.get("content-type")?.includes("application/json")) {
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return jsonError("Invalid JSON", 400);
      }
      requestBody = parsed as Record<string, unknown>;
    } catch {
      return jsonError("Invalid JSON", 400);
    }
  }

  try {
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
    const video = await videoRef.get();
    const videoData = video.data();

    if (!video.exists || !videoData) {
      return jsonError("Video not found", 404);
    }

    if (videoData.video_url) {
      return NextResponse.json({ ok: true, message: "Video already exist" });
    }

    const token = req.nextUrl.searchParams.get("token");
    const signatureHeader =
      req.headers.get("x-did-signature") ?? req.headers.get("x-webhook-signature");
    const secret = typeof videoData.secret_token === "string" ? videoData.secret_token : "";

    if (!isWebhookAuthorized(rawBody, secret, token, signatureHeader)) {
      return jsonError("Unauthorized", 401);
    }

    const didVideoId = requestBody.id;
    if (typeof didVideoId !== "string" || !didVideoId) {
      return jsonError("Missing D-ID video ID", 400);
    }

    if (videoData.did_id && videoData.did_id !== didVideoId) {
      return jsonError("Video ID mismatch", 400);
    }

    if (!videoData.did_id) {
      await videoRef.update({ did_id: didVideoId });
    }

    const status = requestBody.status;
    await recordWebhook(id, typeof status === "string" ? status : "unknown");

    if (status !== "done") {
      if (status === "error") {
        const errorDetails =
          requestBody.error && typeof requestBody.error === "object"
            ? requestBody.error
            : null;
        const errorMessage =
          errorDetails &&
          "description" in errorDetails &&
          typeof errorDetails.description === "string"
            ? errorDetails.description
            : "Video generation failed";

        await videoRef.update({
          d_id_status: status,
          error: errorDetails,
          errorMessage,
        });

        await adminDb.collection(NOTIFICATION_COLLECTION).add({
          type: NOTIFICATION_TYPE.VIDEO_GENERATION_FAILED,
          status: NOTIFICATION_STATUS.UNREAD,
          video_id: id,
          user_id: videoData.owner,
          created_at: Math.floor(Date.now() / 1000).toString(),
        });
        return NextResponse.json({ ok: true });
      }

      await videoRef.update({
        d_id_status: typeof status === "string" ? status : "unknown",
      });
      return NextResponse.json({ ok: true });
    }

    const resultUrl = requestBody.result_url;
    if (typeof resultUrl !== "string" || !resultUrl) {
      return jsonError("Missing result URL", 400);
    }

    const addVideoResponse = await addVideoToStorage(id, resultUrl, status);
    if (!addVideoResponse.status) {
      return jsonError("Error adding video to storage", 400);
    }

    await adminDb.collection(NOTIFICATION_COLLECTION).add({
      type: NOTIFICATION_TYPE.VIDEO_GENERATED,
      status: NOTIFICATION_STATUS.UNREAD,
      video_id: id,
      user_id: videoData.owner,
      created_at: Math.floor(Date.now() / 1000).toString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return jsonError("Failed to process webhook", 400);
  }
  } catch {
    return jsonError("Failed to process webhook", 400);
  }
};
