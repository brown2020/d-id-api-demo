"use server";

import axios, { AxiosError } from "axios";
import { adminBucket, adminDb } from "../firebase/firebaseAdmin";
import { requireAuth } from "./auth";
import { VIDEO_COLLECTION } from "../libs/constants";

interface RetrieveVideoResponse {
  status: "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

// Interface for D-ID talk item from API
interface DIDTalkItem {
  id: string;
  status: "done" | "created" | "started" | "failed";
  result_url?: string;
  thumbnail_url?: string;
  error?: string;
  config?: Record<string, unknown>;
  created_at?: string;
  modified_at?: string;
  [key: string]: unknown; // For other properties we don't explicitly define
}

// Helper function to fetch the result of the talk with retries
async function fetchResult(
  talkId: string,
  authorization: string,
  maxRetries = 3
) {
  await requireAuth();

  // Use the passed authorization
  const baseUrl = "https://api.d-id.com";

  let lastError: unknown = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // First attempt to get the specific video by ID
      const specificResponse = await axios.get(`${baseUrl}/talks/${talkId}`, {
        headers: {
          accept: "application/json",
          authorization,
        },
      });

      if (specificResponse.status === 200) {
        return specificResponse.data;
      }

      // If we get here with a non-200 status
      lastError = new Error(
        `Failed to fetch result with status ${specificResponse.status}`
      );
    } catch (error: unknown) {
      // Safely log error information

      // Type guard for Axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Log more detailed error information if available
        if (axiosError.response) {

          // If it's a 404, try the alternative approach of listing all talks
          if (axiosError.response.status === 404) {

            try {
              // Get list of all talks to find our video
              const listResponse = await axios.get(
                `${baseUrl}/talks?limit=10`,
                {
                  headers: {
                    accept: "application/json",
                    authorization,
                  },
                }
              );

              if (
                listResponse.status === 200 &&
                listResponse.data &&
                Array.isArray(listResponse.data.talks)
              ) {
                const foundVideo = listResponse.data.talks.find(
                  (talk: DIDTalkItem) => talk.id === talkId
                );
                if (foundVideo) {
                  return foundVideo;
                } else {
                }
              }
            } catch {
            }
          }
        }
      }

      lastError = error;

      // If it's not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch video status after multiple attempts");
}

export async function retrieveDIDVideo(
  apiKey: string,
  videoId: string,
  talkingPhotoId: string,
  pollInterval: number = 1000,
  basicAuth: string = ""
): Promise<RetrieveVideoResponse | null> {
  await requireAuth();

  // Use environment variable as a fallback if no API key is provided
  const finalApiKey = apiKey || process.env.DID_API_KEY || "";
  const finalBasicAuth = basicAuth || process.env.D_ID_BASIC_AUTH || "";

  // Log which API key we're using (without revealing the actual value)

  if (!finalApiKey && !finalBasicAuth) {
    return {
      status: "failed",
      error:
        "D-ID authentication is missing. Please add either a D-ID API key or Basic Auth in your profile settings.",
    };
  }

  try {
    // First, get the did_id (the actual D-ID API talk ID) from our database
    // This is crucial because our videoId is not the same as D-ID's talk ID

    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(videoId);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {

      return {
        status: "failed",
        error: "Video not found in database",
      };
    }

    const videoData = videoDoc.data();
    if (!videoData) {
      return {
        status: "failed",
        error: "Video data is missing",
      };
    }

    // Get the D-ID talk ID from the document
    const didTalkId = videoData.did_id;
    if (!didTalkId) {
      return {
        status: "failed",
        error: "D-ID talk ID is missing from the video record",
      };
    }


    // Define the authorization header properly based on the available auth methods
    let authHeader;

    // First priority: Use Basic Auth from profile if available
    if (finalBasicAuth && finalBasicAuth.startsWith("Basic ")) {
      authHeader = finalBasicAuth;
    }
    // Second priority: Use D_ID_BASIC_AUTH environment variable
    else if (
      process.env.D_ID_BASIC_AUTH &&
      process.env.D_ID_BASIC_AUTH.startsWith("Basic ")
    ) {
      authHeader = process.env.D_ID_BASIC_AUTH;
    }
    // Third priority: API key starting with "Basic"
    else if (finalApiKey.startsWith("Basic ")) {
      authHeader = finalApiKey;
    }
    // Fourth priority: API key with colon (username:password format)
    else if (finalApiKey.includes(":")) {
      authHeader = `Basic ${Buffer.from(finalApiKey).toString("base64")}`;
    }
    // Last resort: Assume API key is already Base64 encoded
    else {
      authHeader = `Basic ${finalApiKey}`;
    }

    // Try to poll for the video status with exponential backoff
    const maxAttempts = 12; // Maximum number of attempts
    let resultData: DIDTalkItem | null = null;


    let attempts = 0;
    while (attempts < maxAttempts) {
      try {

        // Use the authHeader we constructed above instead of finalApiKey
        resultData = await fetchResult(didTalkId, authHeader);

        // Make sure resultData is not null before accessing its properties
        if (!resultData) {
          continue;
        }

        if (resultData.status === "done") {
          // Make sure result_url exists
          if (!resultData.result_url) {

            // Update video status in database to reflect the error
            await videoRef.update({
              d_id_status: "error",
              errorMessage: "Video completed but URL is missing",
            });

            return {
              status: "failed",
              error: "Video URL is missing from the API response",
            };
          }


          // Download the video from the provided result URL
          const videoResponse = await axios.get(resultData.result_url, {
            responseType: "arraybuffer", // Get the video as a buffer
          });

          // Upload to Firebase Storage
          const file = adminBucket.file(
            `videos/${talkingPhotoId}/${didTalkId}.mp4`
          );
          await file.save(videoResponse.data, {
            metadata: {
              contentType: "video/mp4",
            },
          });

          // Generate a signed URL with a very long expiration (100 years)
          const [videoUrl] = await file.getSignedUrl({
            action: "read",
            expires: "01-01-2124", // Set the expiration date 100 years in the future
          });

          // Save the signed URL to Firestore
          const docRef = adminDb
            .collection("didTalkingPhotos")
            .doc(talkingPhotoId)
            .collection("videos")
            .doc(didTalkId);

          await docRef.set({
            video_url: videoUrl,
            thumbnail_url: resultData.thumbnail_url || null,
            created_at: new Date(),
          });

          // Also update our main video document
          await videoRef.update({
            video_url: videoUrl,
            d_id_status: "done",
            error: null,
            errorMessage: null,
          });

          return {
            status: "completed",
            video_url: videoUrl,
            thumbnail_url: resultData.thumbnail_url,
          };
        } else if (resultData.status === "failed") {

          // Update our main video document with the error
          await videoRef.update({
            d_id_status: "error",
            error: resultData.error
              ? { message: resultData.error }
              : { message: "Unknown error" },
            errorMessage: resultData.error || "Unknown error",
          });

          return {
            status: "failed",
            error:
              resultData.error || "An error occurred during video processing.",
          };
        } else if (
          resultData.status === "started" ||
          resultData.status === "created"
        ) {

          // Update status in our database
          await videoRef.update({
            d_id_status: resultData.status,
          });
        }

        // Make sure to increment the attempts variable
        attempts++;
      } catch (error: unknown) {

        // If this is an Axios error with a 404, the video might not be ready in the D-ID system yet
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status === 404
        ) {
        }
      }

      // Wait for the poll interval before the next check
      const currentDelay = pollInterval * Math.min(attempts, 5); // Increase delay up to 5x
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }

    // If we've reached the maximum attempts without success, we should still consider
    // the video as being processed since we got a successful creation response

    // Update status in our database
    await videoRef.update({
      d_id_status: "processing",
    });

    return {
      status: "processing",
      error: "Video status is still pending. Check back later.",
    };
  } catch {
    return {
      status: "failed",
      error: "An error occurred while retrieving the video. Please try again.",
    };
  }
}
