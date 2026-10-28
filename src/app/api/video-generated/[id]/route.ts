import { NextRequest } from "next/server";

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

async function recordWebhook(videoId: string, status: string) {
  await addWebhookToHistory(
    `video=${videoId} status=${status} at=${new Date().toISOString()}`
  );
}

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const rawBody = await req.text();

  let requestBody: Record<string, unknown> = {};
  if (req.headers.get("content-type")?.includes("application/json")) {
    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return new Response("Invalid JSON", { status: 400 });
      }
      requestBody = parsed as Record<string, unknown>;
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
  }

  try {
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
    const video = await videoRef.get();
    const videoData = video.data();

    if (!video.exists || !videoData) {
      return new Response("Video not found", { status: 404 });
    }

    if (videoData.video_url) {
      return new Response("Video already exist", { status: 200 });
    }

    const token = req.nextUrl.searchParams.get("token");
    const signatureHeader =
      req.headers.get("x-did-signature") ?? req.headers.get("x-webhook-signature");
    const secret = typeof videoData.secret_token === "string" ? videoData.secret_token : "";

    if (!isWebhookAuthorized(rawBody, secret, token, signatureHeader)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const didVideoId = requestBody.id;
    if (typeof didVideoId !== "string" || !didVideoId) {
      return new Response("Missing D-ID video ID", { status: 400 });
    }

    if (videoData.did_id && videoData.did_id !== didVideoId) {
      return new Response("Video ID mismatch", { status: 400 });
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
        return new Response("Webhook processed successfully", { status: 200 });
      }

      await videoRef.update({
        d_id_status: typeof status === "string" ? status : "unknown",
      });
      return new Response("Webhook processed successfully", { status: 200 });
    }

    const resultUrl = requestBody.result_url;
    if (typeof resultUrl !== "string" || !resultUrl) {
      return new Response("Missing result URL", { status: 400 });
    }

    const addVideoResponse = await addVideoToStorage(id, resultUrl, status);
    if (!addVideoResponse.status) {
      return new Response("Error adding video to storage", { status: 400 });
    }

    await adminDb.collection(NOTIFICATION_COLLECTION).add({
      type: NOTIFICATION_TYPE.VIDEO_GENERATED,
      status: NOTIFICATION_STATUS.UNREAD,
      video_id: id,
      user_id: videoData.owner,
      created_at: Math.floor(Date.now() / 1000).toString(),
    });

    return new Response("Webhook processed successfully", { status: 200 });
  } catch {
    return new Response("Failed to process webhook", { status: 400 });
  }
};
