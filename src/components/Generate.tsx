"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import useProfileStore from "@/zustand/useProfileStore";
import { retrieveDIDVideo } from "@/actions/retrieveDIDVideo";
import AvatarCard from "@/components/AvatarCard";
import { PulseLoader } from "react-spinners";
import PreviousVideos from "@/components/PreviousVideos";
import TextareaAutosize from "react-textarea-autosize";
import { getApiBaseUrl } from "@/libs/utils";
import { generateVideo } from "@/actions/generateVideo";
import { DIDTalkingPhoto } from "@/types/did";
import LocalhostWarning from "./LocalhostWarning";
import Link from "next/link";

export default function Generate() {
  const profile = useProfileStore((state) => state.profile);
  const [itemDetails, setItemDetails] = useState<DIDTalkingPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [useFallbackImage, setUseFallbackImage] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      const selectedId = profile.selectedTalkingPhoto;
      if (!selectedId) {
        console.log("No selectedTalkingPhoto found.");
        setFetchError("No avatar selected. Please select an avatar first.");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching details for selectedTalkingPhoto:", selectedId);
        const docRef = doc(db, "didTalkingPhotos", selectedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as DIDTalkingPhoto; // Cast data to the correct type
          console.log("Document found:", data);
          setItemDetails(data);
          setFetchError(null);
        } else {
          console.error("No such document found in Firestore!");
          setFetchError(
            "The selected avatar could not be found. Please select a different avatar."
          );
        }
      } catch (error) {
        console.error("Error fetching document from Firestore:", error);
        setFetchError(
          "There was an error loading the avatar details. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [profile.selectedTalkingPhoto]);

  const handleUseFallback = () => {
    setUseFallbackImage(true);
  };

  const handleGenerate = async () => {
    if (!profile.selectedTalkingPhoto) {
      setError("No selected talking photo.");
      return;
    }

    if (!itemDetails?.voiceId) {
      setError("Voice ID is missing for the selected talking photo.");
      return;
    }

    const imageUrl = itemDetails?.preview_image_url || "";
    const baseUrl = getApiBaseUrl() ?? window.location.origin;

    console.log("Starting video generation...");
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateVideo(
        null,
        profile.did_api_key || "",
        baseUrl,
        imageUrl,
        script,
        itemDetails.voiceId,
        "",
        profile.elevenlabs_api_key,
        "neutral",
        "neutral",
        useFallbackImage // Pass the fallback flag
      );

      if (result.status && result && "id" in result && result.id) {
        console.log("Video generation initiated. Video ID:", result.id);
        const statusResponse = await retrieveDIDVideo(
          profile.did_api_key || "",
          result.id,
          profile.selectedTalkingPhoto || "noTalkingPhotoId"
        );

        if (statusResponse && statusResponse.status === "completed") {
          console.log(
            "Video generation completed. Video URL:",
            statusResponse.video_url
          );
          setVideoUrl(statusResponse.video_url!);
        } else if (statusResponse && statusResponse.status === "failed") {
          console.error("Video generation failed:", statusResponse.error);
          setError(statusResponse.error || "Video generation failed.");
        }
      } else if (!result.status) {
        console.error("Failed to generate video:", result.message);
        setError(result.message || "Failed to generate video.");
      }
    } catch (error) {
      console.error("Error during video generation:", error);
      setError("An error occurred while generating the video.");
    } finally {
      setIsGenerating(false);
      console.log("Video generation process completed.");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading avatar details...</div>;
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-6 max-w-md w-full">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-orange-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">{fetchError}</p>
            </div>
          </div>
        </div>
        <Link
          href="/avatars"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
        >
          Go to Avatars Page
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Generate</h2>

      <LocalhostWarning onUseFallback={handleUseFallback} />

      {useFallbackImage && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
          <p className="text-sm text-blue-700">
            <strong>Using fallback image:</strong> Your video will be generated
            with a generic headshot image. This is for testing purposes only and
            won&apos;t reflect your selected avatar.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="useFallbackImageToggle"
          checked={useFallbackImage}
          onChange={(e) => setUseFallbackImage(e.target.checked)}
          className="mr-2"
        />
        <label
          htmlFor="useFallbackImageToggle"
          className="text-sm text-gray-700"
        >
          Use fallback image (recommended if you&apos;re having issues with
          video generation)
        </label>

        <button
          onClick={() => window.open("/test-image-access", "_blank")}
          className="ml-3 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
        >
          Test Image Accessibility
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="mr-auto mb-4">
          <AvatarCard id={profile.selectedTalkingPhoto} />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <TextareaAutosize
            minRows={3}
            placeholder="Script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="border rounded-sm p-2 resize-none"
          />
          <button
            onClick={handleGenerate}
            className="bg-blue-500 text-white px-4 py-2 h-10 rounded-md flex items-center justify-center"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <PulseLoader size={10} color={"#ffffff"} />
            ) : (
              "Generate Video"
            )}
          </button>
          {error && (
            <div className="text-red-500 mt-2">
              <p>{error}</p>
              {error.includes("API key") && (
                <p className="mt-1">
                  <Link
                    href="/api-diagnostics"
                    className="underline hover:text-red-700"
                  >
                    Check API Key Diagnostics
                  </Link>{" "}
                  for troubleshooting help.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {videoUrl && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">Generated Video</h3>
          <video controls src={videoUrl} className="w-full rounded-sm"></video>
        </div>
      )}

      <PreviousVideos talkingPhotoId={profile.selectedTalkingPhoto} />
    </div>
  );
}
