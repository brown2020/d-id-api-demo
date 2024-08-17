"use server";

import axios from "axios";
import { adminBucket, adminDb } from "@/firebase/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";

interface RetrieveVideoResponse {
  status: "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

// Helper function to fetch the result of the talk
async function fetchResult(talkId: string, apiKey: string) {
  auth().protect();
  const response = await axios.get(`https://api.d-id.com/talks/${talkId}`, {
    headers: {
      Authorization: `Basic ${apiKey}`,
    },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch result with status ${response.status}`);
  }

  return response.data;
}

export async function retrieveDIDVideo(
  apiKey: string,
  talkId: string,
  talkingPhotoId: string,
  pollInterval: number = 1000
): Promise<RetrieveVideoResponse | null> {
  try {
    let resultData;
    while (true) {
      resultData = await fetchResult(talkId, apiKey);

      if (resultData.status === "done") {
        console.log(
          "Video processing completed, downloading from URL:",
          resultData.result_url
        );

        // Download the video from the provided result URL
        const videoResponse = await axios.get(resultData.result_url, {
          responseType: "arraybuffer", // Get the video as a buffer
        });

        // Upload to Firebase Storage
        const file = adminBucket.file(`videos/${talkingPhotoId}/${talkId}.mp4`);
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
          .doc(talkId);

        await docRef.set({
          video_url: videoUrl,
          thumbnail_url: resultData.thumbnail_url || null,
          created_at: new Date(),
        });
        console.log("Video URL saved to Firestore.");

        return {
          status: "completed",
          video_url: videoUrl,
          thumbnail_url: resultData.thumbnail_url,
        };
      } else if (resultData.status === "failed") {
        console.error("Video processing failed:", resultData.error);
        return {
          status: "failed",
          error:
            resultData.error || "An error occurred during video processing.",
        };
      }

      // Wait for the poll interval before the next check
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  } catch (error) {
    console.error("Error retrieving video status:", error);
    return {
      status: "failed",
      error: "An error occurred while retrieving the video. Please try again.",
    };
  }
}
