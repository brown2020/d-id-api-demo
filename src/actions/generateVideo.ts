"use server";

import { Emotion, Movement } from "../types/did";
import { protect } from "./auth";
import { generateDIDVideo } from "./generateDIDVideo";
import { VIDEO_COLLECTION } from "../libs/constants";
import { adminDb, admin } from "../firebase/firebaseAdmin";
import { getWebhookUrl, randomString, videoImageProxyUrl } from "../libs/utils";
import { getFileUrl } from "./getFileUrl";
import { addErrorReport } from "./addErrorReport";
import { isEditableVideoStatus } from "../libs/auth-constants";
import { checkDidImageAccess } from "../libs/did-image-access";

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
  movement: Movement = "neutral",
  useFallbackImage: boolean = false,
  basicAuth: string | null = null
) {
  const userId = await protect();

  const id = video_id ? video_id : `new-video-${Date.now()}`;

  try {
    // Create or get the video document in Firestore first, before generating
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
    const videoDoc = await videoRef.get();

    if (videoDoc.exists) {
      const existing = videoDoc.data();
      if (!existing || existing.owner !== userId) {
        return { status: false, message: "Unauthorized", id };
      }
      if (!isEditableVideoStatus(existing.d_id_status)) {
        return {
          status: false,
          message: "Video cannot be edited in its current state",
          id,
        };
      }
    } else {
      await videoRef.set({
        id,
        title: "New Video",
        type: "personal",
        d_id_status: "created",
        created_at: admin.firestore.Timestamp.now(),
        owner: userId,
      });
    }

    // Generate video thumbnail
    const filename = `thumbnail-${randomString(10)}.png`;
    const filePath = `video-image/${id}/${filename}`;
    console.log("filePath", filePath);

    // Add that thumbnail to firebase storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    let thumbnailUrl;

    // Check if thumbnail_url is a data URL or already a regular URL
    if (thumbnail_url.startsWith("data:")) {
      const matches = thumbnail_url.match(/^data:(.+);base64,(.+)$/);

      if (!matches) {
        console.error("Invalid data URL format");
        // Use a fallback instead of throwing an error
        thumbnailUrl = `https://didapidemo.vercel.app/assets/headshot_fallback.png`;
      } else {
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
        thumbnailUrl = await getFileUrl(filePath);
      }
    } else {
      // If it's already a URL, just use it directly
      console.log("Using existing URL for thumbnail:", thumbnail_url);
      thumbnailUrl = thumbnail_url;
    }

    // add that thumbnail id to video object
    await videoRef.update({
      thumbnail_url: thumbnailUrl,
    });

    // Create proxy link
    const secret_token = randomString(32);

    // Determine environment by checking the URL structure rather than relying on env vars
    const isLocalhost =
      baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    let imageUrl;

    // Set initial image URL based on explicit useFallbackImage parameter
    if (useFallbackImage) {
      // Use the permanent public URL for the fallback image
      imageUrl = `https://didapidemo.vercel.app/assets/headshot_fallback.png`;
      console.log("Using fallback image as explicitly requested:", imageUrl);
    } else if (isLocalhost) {
      // For localhost without explicit fallback image request, warn but proceed
      console.warn(
        "Running in localhost environment without fallback image selected."
      );
      console.warn(
        "This may cause issues with D-ID API as it requires publicly accessible images."
      );

      // Use the local proxy URL but prepare for potential failure
      const originalProxyUrl = videoImageProxyUrl(baseUrl, `${id}.png`);
      imageUrl = originalProxyUrl;
      console.log(
        "Attempting to use localhost proxy URL (may fail):",
        imageUrl
      );
    } else {
      // For production, use the user's image through our proxy with HTTPS
      const originalProxyUrl = videoImageProxyUrl(baseUrl, `${id}.png`);
      console.log("Original proxy URL:", originalProxyUrl);

      // On Vercel production, we'll use forced HTTPS for the image URL
      // This ensures the D-ID API can access it properly
      imageUrl = originalProxyUrl.replace("http://", "https://");
      if (imageUrl !== originalProxyUrl) {
        console.log("Updated to HTTPS proxy URL:", imageUrl);
      }

      console.log("Using image URL (via proxy):", imageUrl);

      try {
        const didAccessResult = await checkDidImageAccess(imageUrl);

        if (didAccessResult.success) {
          // Continue using the proxy URL since it's working
        } else {
          imageUrl = `https://didapidemo.vercel.app/assets/headshot_fallback.png`;
        }
      } catch {
        imageUrl = `https://didapidemo.vercel.app/assets/headshot_fallback.png`;
      }
    }

    const webhookUrl = getWebhookUrl(baseUrl, id, secret_token);

    if (webhookUrl) {
      console.log("- Webhook URL for D-ID: registered");
    } else {
      console.log("- Webhook URL: not registered (private base URL); using polling");
    }

    const response = await generateDIDVideo(
      apiKey,
      imageUrl,
      webhookUrl,
      inputText,
      voiceId,
      audioUrl,
      elevenlabsApiKey,
      emotion,
      movement,
      basicAuth
    );

    if (response) {
      if ("error" in response && response.error) {
        // Update the document with error information
        await videoRef.update({
          d_id_status: "error",
          errorMessage: response.error,
          updated_at: admin.firestore.Timestamp.now(),
        });

        return {
          status: false,
          message: response.error || "Error generating video",
          id: id,
        };
      } else if ("id" in response) {
        // Update the document with D-ID information
        await videoRef.update({
          did_id: response.id,
          d_id_status: response.status,
          secret_token,
          used_fallback_image: useFallbackImage,
          updated_at: admin.firestore.Timestamp.now(),
        });

        console.log(
          `Successfully updated video document with D-ID ID: ${response.id}`
        );

        return {
          status: true,
          id: id,
        };
      }
      return { status: false, message: "Error generating video", id };
    }

    // Shouldn't reach here, but handle as failure case
    return { status: false, message: "Error generating video", id };
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

    // Try to update the video document with error information
    try {
      const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
      await videoRef.update({
        d_id_status: "error",
        errorMessage: errorMessage,
        updated_at: admin.firestore.Timestamp.now(),
      });
    } catch (updateError) {
      console.error("Failed to update video document with error:", updateError);
    }

    return {
      status: false,
      message: errorMessage,
      id,
    };
  }
}
