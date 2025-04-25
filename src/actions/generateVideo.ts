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
  movement: Movement = "neutral",
  useFallbackImage: boolean = false,
  basicAuth: string | null = null
) {
  await protect();
  // const { userId } = auth();

  // TODO: If video id provided
  // TODO: check exist
  // TODO: d_id_status should be draft or blank
  // TODO: owner of video should be current user

  const id = video_id ? video_id : `new-video-${Date.now()}`;

  try {
    // Create or get the video document in Firestore first, before generating
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
    const videoDoc = await videoRef.get();

    // If the video document doesn't exist, create it with initial values
    if (!videoDoc.exists) {
      console.log(`Creating new video document with ID: ${id}`);
      await videoRef.set({
        id,
        title: "New Video",
        type: "personal",
        d_id_status: "created",
        created_at: admin.firestore.Timestamp.now(),
        owner: "user", // TODO: Use actual user ID
      });
    } else {
      console.log(`Found existing video document with ID: ${id}`);
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

    // Determine if we should use the fallback image for localhost
    const isLocalhost =
      baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    let imageUrl;

    // Set initial image URL based on environment and user preference
    if (isLocalhost || useFallbackImage) {
      // Use the permanent public URL for the fallback image
      imageUrl = `https://didapidemo.vercel.app/assets/headshot_fallback.png`;
      console.log("Using permanent public fallback image URL:", imageUrl);
    } else {
      // For production, first try to use the user's image through our proxy
      const originalProxyUrl = videoImageProxyUrl(baseUrl, `${id}.png`);
      console.log("Original proxy URL:", originalProxyUrl);

      // On Vercel production, we'll use forced HTTPS for the image URL
      // This ensures the D-ID API can access it properly
      imageUrl = originalProxyUrl.replace("http://", "https://");
      if (imageUrl !== originalProxyUrl) {
        console.log("Updated to HTTPS proxy URL:", imageUrl);
      }

      console.log("Using image URL (via proxy):", imageUrl);

      // Test if the image is accessible from D-ID's perspective
      try {
        console.log("Testing image accessibility for D-ID...");
        const testUrl = `${baseUrl}/api/check-did-image-access?url=${encodeURIComponent(
          imageUrl
        )}`;
        console.log("Testing URL:", testUrl);

        const didAccessResponse = await fetch(testUrl);
        const didAccessResult = await didAccessResponse.json();

        if (didAccessResult.success) {
          console.log(
            "✅ Image should be accessible to D-ID:",
            didAccessResult
          );
          // Continue using the proxy URL since it's working
        } else {
          console.warn(
            "⚠️ Image might not be accessible to D-ID:",
            didAccessResult
          );
          // Fall back to the public image
          imageUrl = `https://didapidemo.vercel.app/assets/headshot_fallback.png`;
          console.log("Falling back to public URL for D-ID compatibility");
        }
      } catch (error) {
        console.error("Error testing image accessibility for D-ID:", error);
        // Fall back to the public image
        imageUrl = `https://didapidemo.vercel.app/assets/headshot_fallback.png`;
        console.log(
          "Falling back to public URL due to error in D-ID accessibility testing"
        );
      }
    }

    const webhookUrl = getWebhookUrl(baseUrl, id, secret_token);

    // Check if baseUrl is localhost - this is likely to cause issues
    if (isLocalhost) {
      console.warn(
        "⚠️ WARNING: Using localhost URL for D-ID API with fallback image."
      );
      console.warn(
        "For production use, you should access the application through an ngrok URL, not localhost."
      );
    }

    // Add this special diagnostic log
    console.log("📋 DIAGNOSTIC INFO 📋");
    console.log(`- Base URL: ${baseUrl}`);
    console.log(`- Using ngrok: ${baseUrl.includes("ngrok") ? "Yes" : "No"}`);
    console.log(`- Using fallback image: ${useFallbackImage ? "Yes" : "No"}`);
    console.log(`- Image URL for D-ID: ${imageUrl}`);
    console.log(`- Webhook URL for D-ID: ${webhookUrl}`);
    console.log(
      `- Production vs Local: NODE_ENV=${process.env.NODE_ENV}, NEXT_PUBLIC_IS_LOCAL=${process.env.NEXT_PUBLIC_IS_LOCAL}`
    );
    console.log(
      `- API Keys provided: D-ID (${apiKey ? "Yes" : "No"}), D-ID Basic Auth (${
        basicAuth ? "Yes" : "No"
      }), ElevenLabs (${elevenlabsApiKey ? "Yes" : "No"})`
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
