"use server";
import { adminDb } from "@/firebase/firebaseAdmin";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { getCurrentUser } from "./getCurrentUser";
import { getDIDVideo } from "./getDIDVideo";
import { syncVideo } from "./syncVideo";

export async function getVideo(d_id_api_key: string, video_id: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get video data from firestore
  const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(video_id);
  const video = await videoRef.get();
  const videoData = video.data();

  // Check if video exists
  if (!videoData || !video.exists || video.data() == undefined) {
    return { error: "Video not found" };
  }

  // If video url already generated then send response
  if (videoData.video_url) {
    return { status: true, video_url: videoData.video_url };
  }

  // Check Video ownership
  if (videoData.owner !== user.uid) {
    return { error: "Unauthorized" };
  }

  // Video should have D-ID video id
  if (!videoData.did_id) {
    return { error: "D-ID video ID not found" };
  }

  // If video url not generated then call getDIDVideo
  const response = await getDIDVideo(d_id_api_key, videoData.did_id);

  if (response == null) {
    return { error: "Error getting video" };
  }

  if ("error" in response) {
    // Update video detail if video does not have added error
    return { error: response.error };
  }

  if (response.status === "done") {
    // Get the video url
    const video_url = response.result_url;
    if (!videoData.video_url) {
      await syncVideo({
        video_id: video_id,
        owner: videoData.owner,
        video_url: video_url,
      });
    }
    return { status: true, video_url };
  }

  // Return processing
  return { status: false, message: "Processing" };
}
