import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { adminDb } from "@/firebase/firebaseAdmin";
import {
  NOTIFICATION_COLLECTION,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  VIDEO_COLLECTION,
} from "@/libs/constants";
import { addVideoToStorage } from "@/actions/addVideoToStorage";
import { addWebhookToHistory } from "@/actions/addWebhookToHistory";


function verifyWebhookSignature(
  rawBody: string,
  secret: string,
  token: string | null,
  signatureHeader: string | null
): boolean {
  if (signatureHeader) {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const { method, headers, url } = req;

  // Parse the URL to get the query parameters
  const { searchParams } = new URL(url);

  // Construct the base cURL command for logging
  let curlCommand = `curl -X ${method} "${url}"`;

  // Add headers to the cURL command
  headers.forEach((value, key) => {
    curlCommand += ` -H "${key}: ${value}"`;
  });

  // Add query parameters to the URL (if any)
  if (Array.from(searchParams).length > 0) {
    curlCommand = `curl -X ${method} "${url}"`;
  }

  const rawBody = await req.text();

  // Add the body to the cURL command if the request has one
  if (["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
    if (rawBody) {
      curlCommand += ` -d '${rawBody}'`;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let requestBody: Record<string, any> = {};
  if (headers.get("content-type")?.includes("application/json")) {
    try {
      requestBody = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
  }

  await addWebhookToHistory(curlCommand);

  const process = await new Promise<{ status: true } | { error: string }>(
    async (resolve) => {
      try {
        // Get token from query params
        const token = req.nextUrl.searchParams.get("token");
        if (!token) {
          resolve({ error: "Token is required" });
          return;
        }

        const body = requestBody;

        // Find video by ID
        const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
        const video = await videoRef.get();
        const videoData = video.data();

        if (
          videoData == undefined ||
          !video.exists ||
          video.data() == undefined
        ) {
          resolve({ error: "Video not found" });
          return;
        }

        // Send response if video already exist
        if (videoData.video_url) {
          resolve({ error: "Video already exist" });
          return;
        }

        // Authenticate request with secret key / webhook signature
        const secret_token = videoData.secret_token;
        const signatureHeader =
          headers.get("x-did-signature") ?? headers.get("x-webhook-signature");
        if (
          !secret_token ||
          !verifyWebhookSignature(rawBody, secret_token, token, signatureHeader)
        ) {
          resolve({ error: "Unauthorized" });
          return;
        }

        // D-ID talk id from webhook body
        const did_video_id = body.id;
        if (!did_video_id || typeof did_video_id !== "string") {
          resolve({ error: "Missing D-ID video ID" });
          return;
        }

        // Allow webhook to arrive before generateVideo persists did_id (race)
        if (videoData.did_id && videoData.did_id !== did_video_id) {
          resolve({ error: "Video ID mismatch" });
          return;
        }

        if (!videoData.did_id) {
          await videoRef.update({ did_id: did_video_id });
        }

        // Find video url from request
        const result_url = body.result_url;

        // Get status from request
        const status = body.status;

        if (status !== "done") {
          if (status == "error") {
            const errorDetails = body.error;
            const errorMessage = body.error?.description;

            await videoRef.update({
              d_id_status: status,
              error: errorDetails,
              errorMessage: errorMessage,
            });

            const notificationRef = adminDb.collection(NOTIFICATION_COLLECTION);
            await notificationRef.add({
              type: NOTIFICATION_TYPE.VIDEO_GENERATION_FAILED,
              status: NOTIFICATION_STATUS.UNREAD,
              video_id: id,
              user_id: videoData.owner,
              created_at: Math.floor(Date.now() / 1000).toString(),
            });
            resolve({ status: true });
          } else {
            await videoRef.update({
              d_id_status: status,
            });
            resolve({ status: true });
          }
        } else {
          // Download video from result_url and upload that video to firebase storage
          const addVideoResponse = await addVideoToStorage(
            id,
            result_url,
            status
          );
          if (addVideoResponse.status) {
            // Add new notification to notification collection
            const notificationRef = adminDb.collection(NOTIFICATION_COLLECTION);
            await notificationRef.add({
              type: NOTIFICATION_TYPE.VIDEO_GENERATED,
              status: NOTIFICATION_STATUS.UNREAD,
              video_id: id,
              user_id: videoData.owner,
              created_at: Math.floor(Date.now() / 1000).toString(),
            });

            resolve({ status: true });
          } else {
            resolve({ error: "Error adding video to storage" });
          }
        }

        return;
      } catch {
        resolve({ error: "Failed to process webhook" });
      }
    }
  );

  if ("error" in process) {
    return new Response(process.error, { status: 400 });
  } else {
    return new Response("Webhook processed successfully", { status: 200 });
  }
};
