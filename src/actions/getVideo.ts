"use server";
import { adminDb } from "@/firebase/firebaseAdmin";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { getCurrentUser } from "./auth";
import { getDIDVideo } from "./getDIDVideo";
import { addVideoToStorage } from "./addVideoToStorage";
import { syncVideo } from "./syncVideo";

export async function getVideo(d_id_api_key: string, video_id: string) {
  try {
  const user = await getCurrentUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get video data from firestore
  const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(video_id);
  const video = await videoRef.get();
  const videoData = video.data();

  if (!videoData || !video.exists) {
    return { error: "Video not found" };
  }

  if (videoData.owner !== user.uid) {
    return { error: "Unauthorized" };
  }

  if (videoData.demo_mode === true) {
    return {
      status: true,
      video_url:
        typeof videoData.video_url === "string" && videoData.video_url
          ? videoData.video_url
          : "/demo/sample-talking-avatar.mp4",
    };
  }

  // If video url already generated then send response
  if (videoData.video_url) {
    return { status: true, video_url: videoData.video_url };
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
    const remoteUrl = response.result_url;
    if (!remoteUrl) {
      return { error: "Video URL is missing" };
    }
    if (!videoData.video_url) {
      const saved = await addVideoToStorage(video_id, remoteUrl, "done");
      if (!saved.status || !saved.video_url) {
        return { error: "Error saving video" };
      }
      await syncVideo({
        video_id: video_id,
        owner: videoData.owner,
        video_url: saved.video_url,
      });
      return { status: true, video_url: saved.video_url };
    }
    return { status: true, video_url: videoData.video_url };
  }

  // Return processing
  return { status: false, message: "Processing" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error getting video",
    };
  }
}
