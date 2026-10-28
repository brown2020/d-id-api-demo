"use server";

import { headers } from "next/headers";

import { Emotion, Movement } from "../types/did";
import { requireAuth } from "./auth";
import { generateDIDVideo } from "./generateDIDVideo";
import { VIDEO_COLLECTION } from "../libs/constants";
import { adminDb } from "../firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { getWebhookUrl, randomString, videoImageProxyUrl } from "../libs/utils";
import { addErrorReport } from "./addErrorReport";
import { isEditableVideoStatus } from "../libs/auth-constants";
import { checkDidImageAccess } from "../libs/did-image-access";
import {
  allowedAppOriginsFromHeaders,
  isAllowedAppBaseUrl,
} from "@/libs/app-base-url";
import { INSUFFICIENT_CREDITS_MESSAGE } from "@/libs/video-credits";
import {
  debitVideoGenerationCredits,
  refundVideoGenerationCredits,
} from "@/server/video-credits";
import { materializeVideoThumbnail } from "@/server/materialize-thumbnail";

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
  const userId = await requireAuth();
  const allowedOrigins = allowedAppOriginsFromHeaders(await headers());
  if (!isAllowedAppBaseUrl(baseUrl, allowedOrigins)) {
    return {
      status: false,
      message: "Invalid application base URL",
      id: video_id ?? "",
    };
  }

  const id = video_id ? video_id : `new-video-${Date.now()}`;
  let charged = false;

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
        created_at: Timestamp.now(),
        owner: userId,
      });
    }

    const thumbnail = await materializeVideoThumbnail({
      thumbnailUrl: useFallbackImage
        ? "https://didapidemo.vercel.app/assets/headshot_fallback.png"
        : thumbnail_url,
      videoId: id,
      userId,
    });
    if (!thumbnail.ok) {
      return { status: false, message: thumbnail.message, id };
    }

    const secret_token = randomString(32);
    await videoRef.update({
      thumbnail_url: thumbnail.storedUrl,
      secret_token,
    });

    const debit = await debitVideoGenerationCredits(userId);
    if (!debit.ok) {
      return { status: false, message: INSUFFICIENT_CREDITS_MESSAGE, id };
    }
    charged = true;

    // Determine environment by checking the URL structure rather than relying on env vars
    const isLocalhost =
      baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    let imageUrl;

    // Set initial image URL based on explicit useFallbackImage parameter
    if (useFallbackImage) {
      // Use the permanent public URL for the fallback image
      imageUrl = `https://didapidemo.vercel.app/assets/headshot_fallback.png`;
    } else if (isLocalhost) {
      // For localhost without explicit fallback image request, warn but proceed

      // Use the local proxy URL but prepare for potential failure
      const originalProxyUrl = videoImageProxyUrl(baseUrl, `${id}.png`);
      imageUrl = originalProxyUrl;
    } else {
      // For production, use the user's image through our proxy with HTTPS
      const originalProxyUrl = videoImageProxyUrl(baseUrl, `${id}.png`);

      // On Vercel production, we'll use forced HTTPS for the image URL
      // This ensures the D-ID API can access it properly
      imageUrl = originalProxyUrl.replace("http://", "https://");
      if (imageUrl !== originalProxyUrl) {
      }


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
    } else {
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
          updated_at: Timestamp.now(),
        });

        await refundVideoGenerationCredits(userId);
        charged = false;
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
          updated_at: Timestamp.now(),
        });


        return {
          status: true,
          id: id,
        };
      }
      await refundVideoGenerationCredits(userId);
      charged = false;
      return { status: false, message: "Error generating video", id };
    }

    await refundVideoGenerationCredits(userId);
    charged = false;
    return { status: false, message: "Error generating video", id };
  } catch (error) {
    if (charged) {
      try {
        await refundVideoGenerationCredits(userId);
      } catch {
        // The original error is still reported below.
      }
    }
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

    await addErrorReport("generateDIDVideo", errorDetails);

    // Try to update the video document with error information
    try {
      const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
      await videoRef.update({
        d_id_status: "error",
        errorMessage: errorMessage,
        updated_at: Timestamp.now(),
      });
    } catch {
    }

    return {
      status: false,
      message: errorMessage,
      id,
    };
  }
}
