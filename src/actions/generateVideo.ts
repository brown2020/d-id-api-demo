"use server";

import { Emotion, Movement } from "../types/did";
import { protect } from "./auth";
import { generateDIDVideo } from "./generateDIDVideo";
import { VIDEO_COLLECTION } from "../libs/constants";
import { adminDb, admin } from "../firebase/firebaseAdmin";
import { getWebhookUrl, randomString, videoImageProxyUrl } from "../libs/utils";
import { getFileUrl } from "./getFileUrl";
import { addErrorReport } from "./addErrorReport";

export async function generateVideo(
  video_id: string | null,
  apiKey: string | null,
  baseUrl: string,
  thumbnail_url: string,
  inputText?: string,
  voiceId?: string,
  audioUrl?: string,
  elevenlabsApiKey?: string,
  emotion: Emotion = "neutral",
  movement: Movement = "neutral"
) {
  await protect();
  // const { userId } = auth();

  // TODO: If video id provided
  // TODO: check exist
  // TODO: d_id_status should be draft or blank
  // TODO: owner of video should be current user

  const id = video_id ? video_id : `new-video-${Date.now()}`;

  // Generate video thubnail
  const filename = `thumbnail-${randomString(10)}.png`;
  const filePath = `video-image/${id}/${filename}`;
  console.log("filePath", filePath);

  // Add that thumbnail to firebase storage
  const bucket = admin.storage().bucket();
  const file = bucket.file(filePath);
  const matches = thumbnail_url.match(/^data:(.+);base64,(.+)$/);
  try {
    if (!matches) {
      throw new Error("Invalid data URL format");
    }

    const mimeType = matches[1]; // e.g., 'image/png'
    const base64Data = matches[2];

    // Create a temporary file
    const buffer = Buffer.from(base64Data, "base64");

    // Save the file directly to Firebase Storage
    await file.save(buffer, {
      metadata: {
        contentType: mimeType, // Set the MIME type of the file
      },
    });

    // Create public url for that thumbnail
    const thumbnailUrl = await getFileUrl(filePath);

    // add that thumbnail id to video object
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
    await videoRef.set(
      {
        thumbnail_url: thumbnailUrl,
      },
      { merge: true }
    );

    // Create proxy link
    const secret_token = randomString(32);
    const imageUrl = videoImageProxyUrl(baseUrl, `${id}.png`);
    const webhookUrl = getWebhookUrl(baseUrl, id, secret_token);

    // Check if baseUrl is localhost - this is likely to cause issues
    if (baseUrl.includes("localhost")) {
      console.warn(
        "⚠️ WARNING: Using localhost URL for D-ID API! This will likely cause errors as D-ID cannot access localhost URLs."
      );
      console.warn(
        "You should be accessing the application through ngrok URL, not localhost."
      );
    }

    // Add this special diagnostic log
    console.log("📋 DIAGNOSTIC INFO 📋");
    console.log(`- Base URL: ${baseUrl}`);
    console.log(`- Using ngrok: ${baseUrl.includes("ngrok") ? "Yes" : "No"}`);
    console.log(`- Image URL for D-ID: ${imageUrl}`);
    console.log(`- Webhook URL for D-ID: ${webhookUrl}`);
    console.log(
      `- API Keys provided: D-ID (${apiKey ? "Yes" : "No"}), ElevenLabs (${
        elevenlabsApiKey ? "Yes" : "No"
      })`
    );
    console.log(
      `- Script length: ${inputText ? inputText.length : 0} characters`
    );
    console.log("📋 END DIAGNOSTIC INFO 📋");

    const response = await generateDIDVideo(
      apiKey,
      imageUrl,
      webhookUrl,
      inputText,
      voiceId,
      audioUrl,
      elevenlabsApiKey,
      emotion,
      movement
    );

    if (response) {
      if ("error" in response && response.error) {
        return {
          status: false,
          message: response.error || "Error generating video",
          id: id,
        };
      } else if ("id" in response) {
        const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);

        await videoRef.set(
          {
            did_id: response.id,
            d_id_status: response.status,
            secret_token,
          },
          { merge: true }
        );
        return {
          status: true,
          id: id,
        };
      }
      return { status: false, message: "Error generating video", id };
    }
  } catch (error) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let errorDetails: Record<string, any> = {};
    let errorMessage = "Unknown error occurred during video generation";

    // Handle known types of error
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack || null,
      };
      errorMessage = error.message || "Error during video generation";
    } else {
      // For unknown errors
      errorDetails = {
        message: "Unknown error occurred",
        raw: typeof error === "object" ? JSON.stringify(error) : String(error), // Safely serialize the error
      };
    }

    console.error("Error in generateVideo:", errorMessage, errorDetails);
    await addErrorReport("generateDIDVideo", errorDetails);

    return {
      status: false,
      message: errorMessage,
      id,
    };
  }

  return { status: false, message: "Error generating video", id };
}
