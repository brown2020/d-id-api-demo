"use server";

import axios, { AxiosError } from "axios";
import { adminBucket, adminDb } from "../firebase/firebaseAdmin";
import { protect } from "./auth";
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
  await protect();

  // Use the passed authorization
  console.log("Using provided authorization for fetching video");
  const baseUrl = "https://api.d-id.com";

  let lastError: unknown = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // First attempt to get the specific video by ID
      console.log(`Attempt ${attempt + 1}: Fetching video with ID: ${talkId}`);
      const specificResponse = await axios.get(`${baseUrl}/talks/${talkId}`, {
        headers: {
          accept: "application/json",
          authorization,
        },
      });

      if (specificResponse.status === 200) {
        console.log("Successfully retrieved video by ID");
        return specificResponse.data;
      }

      // If we get here with a non-200 status
      console.log(`Got non-200 status: ${specificResponse.status}`);
      lastError = new Error(
        `Failed to fetch result with status ${specificResponse.status}`
      );
    } catch (error: unknown) {
      // Safely log error information
      console.log(
        `Direct request failed:`,
        error instanceof Error ? error.message : String(error)
      );

      // Type guard for Axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Log more detailed error information if available
        if (axiosError.response) {
          console.log(`Response status: ${axiosError.response.status}`);
          console.log(`Response data:`, axiosError.response.data);

          // If it's a 404, try the alternative approach of listing all talks
          if (axiosError.response.status === 404) {
            console.log(
              "Video not found by direct ID, trying to find in list of talks"
            );

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
                  console.log("Found video in the list of talks");
                  return foundVideo;
                } else {
                  console.log("Video not found in recent talks list");
                }
              }
            } catch (listError: unknown) {
              console.log(
                "Error fetching list of talks:",
                listError instanceof Error
                  ? listError.message
                  : String(listError)
              );
            }
          }
        }
      }

      lastError = error;

      // If it's not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before next attempt...`);
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
  pollInterval: number = 1000
): Promise<RetrieveVideoResponse | null> {
  await protect();

  // Use environment variable as a fallback if no API key is provided
  const finalApiKey = apiKey || process.env.D_ID_API_KEY || "";

  // Log which API key we're using (without revealing the actual value)
  console.log(
    `retrieveDIDVideo API Key: ${finalApiKey ? "Present" : "Missing"}`
  );
  console.log(`API Key source: ${apiKey ? "Profile" : "Environment Variable"}`);

  if (!finalApiKey) {
    console.error(
      "No D-ID API key available - neither in profile nor in environment variables"
    );
    return {
      status: "failed",
      error:
        "D-ID API key is missing. Please add it in your profile settings or contact the administrator.",
    };
  }

  try {
    // First, get the did_id (the actual D-ID API talk ID) from our database
    // This is crucial because our videoId is not the same as D-ID's talk ID
    console.log(`Getting D-ID talk ID for our internal videoId: ${videoId}`);
    console.log(`Using collection: ${VIDEO_COLLECTION}`);

    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(videoId);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      console.error(`Video document with ID ${videoId} not found in database`);

      // Log collections and documents to help diagnose
      try {
        console.log("Checking all collections...");
        const collections = await adminDb.listCollections();
        console.log(
          "Available collections:",
          collections.map((col) => col.id)
        );

        // Check if we can find the document in both possible collection names
        const manualCheck1 = await adminDb
          .collection("videos")
          .doc(videoId)
          .get();
        const manualCheck2 = await adminDb
          .collection("generated-videos")
          .doc(videoId)
          .get();

        console.log(
          `Check in "videos" collection: ${
            manualCheck1.exists ? "Found" : "Not found"
          }`
        );
        console.log(
          `Check in "generated-videos" collection: ${
            manualCheck2.exists ? "Found" : "Not found"
          }`
        );
      } catch (listError) {
        console.error("Error checking collections:", listError);
      }

      return {
        status: "failed",
        error: "Video not found in database",
      };
    }

    const videoData = videoDoc.data();
    if (!videoData) {
      console.error(`Video document with ID ${videoId} exists but has no data`);
      return {
        status: "failed",
        error: "Video data is missing",
      };
    }

    // Get the D-ID talk ID from the document
    const didTalkId = videoData.did_id;
    if (!didTalkId) {
      console.error(
        `Video document with ID ${videoId} is missing the did_id field`
      );
      return {
        status: "failed",
        error: "D-ID talk ID is missing from the video record",
      };
    }

    console.log(`Found D-ID talk ID in database: ${didTalkId}`);

    // Try to poll for the video status with exponential backoff
    let attempts = 0;
    const maxAttempts = 12; // Maximum number of attempts
    let resultData: DIDTalkItem | null = null;

    console.log(`Polling for video status...`);
    console.log(`- Using D-ID API Key: ${finalApiKey ? "Present" : "Missing"}`);

    // Setup for polling
    const authorization = process.env.D_ID_BASIC_AUTH || `Basic ${finalApiKey}`;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Status check attempt ${attempts}/${maxAttempts}`);

      try {
        // Use the D-ID talk ID here, not our internal videoId
        resultData = await fetchResult(didTalkId, authorization);

        // Make sure resultData is not null before accessing its properties
        if (!resultData) {
          console.log("Received null response from fetchResult, will retry");
          continue;
        }

        if (resultData.status === "done") {
          // Make sure result_url exists
          if (!resultData.result_url) {
            console.error("Video is done but result_url is missing");

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

          console.log(
            "Video processing completed, downloading from URL:",
            resultData.result_url
          );

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
          console.log("Video uploaded to Firebase Storage.");

          // Generate a signed URL with a very long expiration (100 years)
          const [videoUrl] = await file.getSignedUrl({
            action: "read",
            expires: "01-01-2124", // Set the expiration date 100 years in the future
          });
          console.log("Generated signed URL with long expiration:", videoUrl);

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
          console.log("Video URL saved to Firestore.");

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
          console.error(
            "Video processing failed:",
            resultData.error || "No specific error provided"
          );

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
          console.log(
            `Video is still ${resultData.status}, waiting before next check...`
          );

          // Update status in our database
          await videoRef.update({
            d_id_status: resultData.status,
          });
        }
      } catch (error: unknown) {
        console.log(
          `Error checking status (attempt ${attempts}/${maxAttempts}):`,
          error instanceof Error ? error.message : String(error)
        );

        // If this is an Axios error with a 404, the video might not be ready in the D-ID system yet
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status === 404
        ) {
          console.log(
            "Video not found (404) - D-ID may still be registering it. Retrying..."
          );
        }
      }

      // Wait for the poll interval before the next check
      const currentDelay = pollInterval * Math.min(attempts, 5); // Increase delay up to 5x
      console.log(`Waiting ${currentDelay}ms before next check...`);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }

    // If we've reached the maximum attempts without success, we should still consider
    // the video as being processed since we got a successful creation response
    console.log(
      `Reached max polling attempts (${maxAttempts}). Assuming video is processing.`
    );

    // Update status in our database
    await videoRef.update({
      d_id_status: "processing",
    });

    return {
      status: "processing",
      error: "Video status is still pending. Check back later.",
    };
  } catch (error: unknown) {
    console.error(
      "Error retrieving video status:",
      error instanceof Error ? error.message : String(error)
    );
    return {
      status: "failed",
      error: "An error occurred while retrieving the video. Please try again.",
    };
  }
}
