import { adminBucket, adminDb } from "@/firebase/firebaseAdmin";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { downloadDidResultVideo } from "@/server/download-did-result";

export async function addVideoToStorage(
  video_id: string,
  result_url: string,
  status: string
) {
  try {
    const bytes = await downloadDidResultVideo(result_url);
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(video_id);
    const bucket = adminBucket;
    const videoPath = `videos/${video_id}.mp4`;
    const file = bucket.file(videoPath);

    await file.save(bytes, {
      metadata: {
        contentType: "video/mp4",
      },
    });

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-17-2125",
    });

    await videoRef.update({
      d_id_status: status,
      d_id_result_url: result_url,
      video_path: videoPath,
      video_url: url,
    });

    return { status: true as const, video_url: url };
  } catch {
    return { status: false as const, video_url: "" };
  }
}
