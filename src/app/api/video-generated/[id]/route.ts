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
import moment from "moment";

export const POST = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  console.log(`Webhook received for video ID: ${id}`);

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
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response("Invalid JSON", { status: 400 });
    }
  }

  await addWebhookToHistory(curlCommand);
  console.log("Webhook body:", JSON.stringify(requestBody, null, 2));

  const process = await new Promise<{ status: true } | { error: string }>(
    async (resolve) => {
      try {
        // Get token from query params
        const token = req.nextUrl.searchParams.get("token");
        if (!token) {
          console.error("Token is missing in webhook request");
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
          console.error(`Video not found: ${id}`);
          resolve({ error: "Video not found" });
          return;
        }

        // Send response if video already exist
        if (videoData.video_url) {
          console.log(`Video already exists: ${id}`);
          resolve({ error: "Video already exist" });
          return;
        }

        // Authenticate request with secret key
        const secret_token = videoData.secret_token;
        if (secret_token !== token) {
          console.error("Unauthorized webhook request - token mismatch");
          resolve({ error: "Unauthorized" });
          return;
        }

        // D_ID video id should match with video data
        const did_video_id = body.id;
        if (videoData == undefined || videoData.did_id !== did_video_id) {
          console.error("Video ID mismatch in webhook request");
          resolve({ error: "Video ID mismatch" });
          return;
        }

        // Find video url from request
        const result_url = body.result_url;
        console.log(`Result URL from D-ID: ${result_url || "Not available"}`);

        // Get status from request
        const status = body.status;
        console.log(`Status from D-ID: ${status}`);

        if (status !== "done") {
          if (status == "error") {
            const errorDetails = body.error;
            const errorMessage = body.error?.description;
            console.error(
              `D-ID error: ${errorMessage || JSON.stringify(errorDetails)}`
            );

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
              created_at: moment().format("X"),
            });
            resolve({ status: true });
          } else {
            console.log(`D-ID status update: ${status}`);
            await videoRef.update({
              d_id_status: status,
            });
            resolve({ status: true });
          }
        } else {
          // Download video from result_url and upload that video to firebase storage
          console.log(`Processing completed video: ${id}`);
          const addVideoResponse = await addVideoToStorage(
            id,
            result_url,
            status
          );
          if (addVideoResponse.status) {
            // Add new notification to notification collection
            console.log(`Video added to storage successfully: ${id}`);
            const notificationRef = adminDb.collection(NOTIFICATION_COLLECTION);
            await notificationRef.add({
              type: NOTIFICATION_TYPE.VIDEO_GENERATED,
              status: NOTIFICATION_STATUS.UNREAD,
              video_id: id,
              user_id: videoData.owner,
              created_at: moment().format("X"),
            });

            resolve({ status: true });
          } else {
            console.error(
              `Error adding video to storage: ${
                typeof addVideoResponse === "object" &&
                "error" in addVideoResponse
                  ? addVideoResponse.error
                  : "Unknown error"
              }`
            );
            resolve({ error: "Error adding video to storage" });
          }
        }

        return;
      } catch (error) {
        console.error("Error processing webhook:", error);
        resolve({ error: "Failed to process webhook" });
      }
    }
  );

  if ("error" in process) {
    console.log(`Webhook processing error: ${process.error}`);
    return new Response(process.error, { status: 400 });
  } else {
    console.log(`Webhook processed successfully for video: ${id}`);
    return new Response("Webhook processed successfully", { status: 200 });
  }
};
