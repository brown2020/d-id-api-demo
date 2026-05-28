"use client";

import { getVideo } from "@/actions/getVideo";
import { db } from "@/firebase/firebaseClient";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { isVideoProcessing } from "@/libs/video-status";
import { DIDVideoStatus, VideoDetail as VideoDetailType } from "@/types/did";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";
import { collection, doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function VideoDetail() {
  const params = useParams();
  const uid = useAuthStore((state) => state.uid);
  const profile = useProfileStore((state) => state.profile);
  const videoId = typeof params?.id === "string" ? params.id : null;
  const [videoData, setVideoData] = useState<VideoDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const previousStatusRef = useRef<DIDVideoStatus | null>(null);

  const syncRemoteVideoStatus = useCallback(
    async (video: VideoDetailType) => {
      if (!isVideoProcessing(video) || !profile.did_api_key?.trim()) {
        setIsPolling(false);
        return;
      }

      setIsPolling(true);
      const response = await getVideo(profile.did_api_key, video.id);

      if (response && "error" in response && response.error) {
        setIsPolling(false);
        toast.error(response.error, { duration: 7000 });
        return;
      }

      if (
        response &&
        "message" in response &&
        response.message === "Processing"
      ) {
        setIsPolling(true);
        return;
      }

      setIsPolling(false);
    },
    [profile.did_api_key]
  );

  const handleVideoSnapshot = useCallback(
    (video: VideoDetailType) => {
      setVideoData(video);

      if (
        video.d_id_status === "done" &&
        previousStatusRef.current !== null &&
        previousStatusRef.current !== "done"
      ) {
        toast.success("Video generated successfully", { duration: 7000 });
      }

      previousStatusRef.current = video.d_id_status;
      void syncRemoteVideoStatus(video);
    },
    [syncRemoteVideoStatus]
  );

  useEffect(() => {
    if (!videoId || !uid) {
      return;
    }

    const docRef = doc(collection(db, VIDEO_COLLECTION), videoId);
    setLoading(true);

    const unsubscribe = onSnapshot(docRef, {
      next: (snapshot) => {
        setLoading(false);

        if (!snapshot.exists()) {
          notFound();
          return;
        }

        handleVideoSnapshot(snapshot.data() as VideoDetailType);
      },
      error: () => {
        setLoading(false);
        toast.error("Could not load this video.");
      },
    });

    return () => {
      unsubscribe();
    };
  }, [videoId, uid, handleVideoSnapshot]);

  const showProcessingState =
    videoData !== null &&
    (isVideoProcessing(videoData) || isPolling) &&
    videoData.d_id_status !== "error";

  return (
    <div className="p-4 bg-white min-h-[60vh]">
      {loading ? (
        <p className="text-2xl font-bold animate-pulse" role="status">
          Fetching video...
        </p>
      ) : videoData ? (
        <div className="flex flex-col gap-4 h-full">
          <h1 className="text-2xl font-bold">
            {videoData.title ?? "Untitled Video"}
          </h1>

          {showProcessingState ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-16"
              role="status"
              aria-live="polite"
            >
              <p className="text-xl font-semibold animate-pulse">
                {isPolling ? "Checking video status..." : "Generating video..."}
              </p>
              <p className="text-sm text-gray-600 text-center max-w-md">
                D-ID is processing your video. This page updates automatically
                when the video is ready.
              </p>
              <Link
                href="/videos"
                className="text-blue-600 underline text-sm mt-2"
              >
                Back to video library
              </Link>
            </div>
          ) : null}

          {videoData.d_id_status === "error" ? (
            <div
              className="flex flex-col items-center justify-center gap-4 py-16"
              role="alert"
            >
              <p className="text-xl font-semibold text-red-600">
                {videoData.errorMessage || "Video generation failed."}
              </p>
              <div className="flex gap-4 text-sm">
                <Link href="/videos" className="text-blue-600 underline">
                  Video library
                </Link>
                <Link
                  href={`/videos/${videoData.id}/edit`}
                  className="text-blue-600 underline"
                >
                  Edit and retry
                </Link>
              </div>
            </div>
          ) : null}

          {videoData.d_id_status === "done" && videoData.video_url ? (
            <div className="flex items-center justify-center py-4">
              <video
                controls
                src={videoData.video_url}
                className="w-full max-h-[70vh] rounded-md bg-black"
              >
                Your browser does not support embedded video playback.
              </video>
            </div>
          ) : null}

          {!showProcessingState &&
          videoData.d_id_status !== "error" &&
          !(videoData.d_id_status === "done" && videoData.video_url) ? (
            <p className="text-gray-600" role="status">
              Video is not available yet.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-lg font-semibold text-gray-600" role="status">
          Video is not available
        </p>
      )}
    </div>
  );
}
