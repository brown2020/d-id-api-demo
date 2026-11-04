"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
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
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { DemoModeNotice } from "@/components/DemoModeNotice";
import {
  builtinDemoAvatar,
  isBuiltinDemoAvatar,
  profileHasDidKey,
} from "@/libs/fallback-voices";
import { formatVideoGenerationError } from "@/libs/video-status";

async function submitGenerate(input: {
  profile: ReturnType<typeof useProfileStore.getState>['profile'];
  itemDetails: DIDTalkingPhoto | null;
  script: string;
  useFallbackImage: boolean;
  setError: (value: string | null) => void;
  setIsGenerating: (value: boolean) => void;
  setDemoNotice: (value: string | null) => void;
  setVideoUrl: (value: string | null) => void;
  router: { push: (href: string) => void };
}) {
  if (!input.profile.selectedTalkingPhoto) {
    input.setError("No avatar selected. Choose one on the Avatars page.");
    return;
  }

  const hasDidProfileKey = Boolean(
    input.profile.did_api_key?.trim() || input.profile.did_basic_auth?.trim()
  );

  if (hasDidProfileKey && !input.profile.elevenlabs_api_key?.trim()) {
    input.setError(
      "ElevenLabs API key is missing. Add it in your Profile for voice generation."
    );
    return;
  }

  if (!input.itemDetails?.voiceId) {
    input.setError("Voice ID is missing for the selected talking photo.");
    return;
  }

  if (!input.script.trim()) {
    input.setError("Enter a script before generating a video.");
    return;
  }

  const imageUrl = input.itemDetails?.preview_image_url || "";
  const baseUrl = getApiBaseUrl() ?? window.location.origin;

  console.log("Starting video generation...");
  input.setIsGenerating(true);
  input.setError(null);
  input.setDemoNotice(null);

  try {
    const result = await generateVideo(
      null,
      input.profile.did_api_key || "",
      baseUrl,
      imageUrl,
      input.script,
      input.itemDetails.voiceId,
      "",
      input.profile.elevenlabs_api_key,
      "neutral",
      "neutral",
      input.useFallbackImage, // Pass the fallback flag
      input.profile.did_basic_auth || "" // Pass the Basic Auth from input.profile
    );

    if (result.status && result && "id" in result && result.id) {
      if ("demoMode" in result && result.demoMode) {
        const notice =
          "notice" in result && typeof result.notice === "string"
            ? result.notice
            : null;
        input.setDemoNotice(notice);
        if ("videoUrl" in result && typeof result.videoUrl === "string") {
          input.setVideoUrl(result.videoUrl);
        }
        toast.success(notice ?? "Sample video is ready.");
        input.router.push(`/videos/${result.id}/show`);
        return;
      }

      const statusResponse = await retrieveDIDVideo(
        input.profile.did_api_key || "",
        result.id,
        input.profile.selectedTalkingPhoto || "noTalkingPhotoId",
        undefined,
        input.profile.did_basic_auth || ""
      );

      if (statusResponse?.status === "failed") {
        input.setError(
          formatVideoGenerationError(
            statusResponse.error || "Video generation failed."
          )
        );
        return;
      }

      if (statusResponse?.status === "completed" && statusResponse.video_url) {
        input.setVideoUrl(statusResponse.video_url);
        toast.success("Your video is ready!");
      } else {
        toast.success(
          "Video submitted! Redirecting to the status page.",
          { duration: 5000 }
        );
      }

      input.router.push(`/videos/${result.id}/show`);
    } else if (!result.status) {
      input.setError(
        formatVideoGenerationError(
          result.message || "Failed to generate video."
        )
      );
    }
  } catch (error) {
    input.setError(
      formatVideoGenerationError(
        error instanceof Error
          ? error.message
          : "An error occurred while generating the video."
      )
    );
  } finally {
    input.setIsGenerating(false);
    void useProfileStore.getState().fetchProfile();
    console.log("Video generation process completed.");
  }
};


function GenerateFetchError({ message }: { message: string }) {
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
            <p className="text-sm text-orange-700">{message}</p>
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

function FallbackImageNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="bg-blue-100 border-l-4 border-blue-500 p-4 mb-4">
      <p className="text-sm text-blue-700">
        <strong>Using fallback image:</strong> Your video will be generated
        with a generic headshot image. This is for testing purposes only and
        won&apos;t reflect your selected avatar.
      </p>
    </div>
  );
}

function GenerateError({ error }: { error: string | null }) {
  if (!error) return null;
  const showKeyHelp =
    error.includes("Profile") ||
    error.includes("API key") ||
    error.includes("Basic Auth");
  return (
    <div className="mt-2">
      {error.includes("celebrity") ? (
        <div className="bg-red-600 text-white p-3 rounded-md shadow-sm">
          <p className="font-semibold mb-1">Celebrity Detected:</p>
          <p>{error}</p>
          <p className="mt-3 text-sm bg-red-700 p-2 rounded">
            Please select a different image or use a non-celebrity avatar.
          </p>
        </div>
      ) : (
        <p className="text-red-500">{error}</p>
      )}
      {showKeyHelp ? (
        <p className="mt-2 text-sm">
          <Link href="/profile" className="text-blue-600 underline">
            Open Profile settings
          </Link>
          {" · "}
          <Link href="/api-diagnostics" className="text-blue-600 underline">
            API diagnostics
          </Link>
        </p>
      ) : null}
      {error.includes("Not enough credits") ? (
        <p className="mt-2 text-sm">
          <Link href="/payment-attempt" className="text-blue-600 underline">
            Buy credits
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function GeneratedPreview({
  videoUrl,
  demoNotice,
}: {
  videoUrl: string | null;
  demoNotice: string | null;
}) {
  if (!videoUrl) return null;
  return (
    <div className="mt-8">
      {demoNotice ? <DemoModeNotice notice={demoNotice} /> : null}
      <h3 className="text-lg font-bold mb-4">Generated Video</h3>
      {demoNotice ? (
        <Image
          src="/demo/sample-talking-avatar.png"
          alt="Sample talking avatar"
          width={320}
          height={180}
          className="mb-4 max-h-48 w-auto rounded-md"
        />
      ) : null}
      <video controls src={videoUrl} className="w-full rounded-sm"></video>
    </div>
  );
}

function GenerateScreen({
  loading,
  fetchError,
  useFallbackImage,
  setUseFallbackImage,
  handleUseFallback,
  itemDetails,
  profile,
  script,
  setScript,
  handleGenerate,
  isGenerating,
  error,
  videoUrl,
  demoNotice,
}: {
  loading: boolean;
  fetchError: string | null;
  useFallbackImage: boolean;
  setUseFallbackImage: (value: boolean) => void;
  handleUseFallback: () => void;
  itemDetails: DIDTalkingPhoto | null;
  profile: ReturnType<typeof useProfileStore.getState>["profile"];
  script: string;
  setScript: (value: string) => void;
  handleGenerate: () => void;
  isGenerating: boolean;
  error: string | null;
  videoUrl: string | null;
  demoNotice: string | null;
}) {
  if (loading) {
    return <div className="text-center py-8">Loading avatar details...</div>;
  }

  if (fetchError) {
    return <GenerateFetchError message={fetchError} />;
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Generate</h2>

      <LocalhostWarning onUseFallback={handleUseFallback} />
      <FallbackImageNotice show={useFallbackImage} />

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

        <button type="button"
          onClick={() => window.open("/test-image-access", "_blank")}
          className="ml-3 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
        >
          Test Image Accessibility
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="mr-auto mb-4">
          <AvatarCard
            id={itemDetails?.talking_photo_id || profile.selectedTalkingPhoto}
            avatar={itemDetails ?? undefined}
          />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <TextareaAutosize
            minRows={3}
            placeholder="Script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="border rounded-sm p-2 resize-none"
          />
          <button type="button"
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
          <p className="text-sm text-gray-600">Uses 1 credit.</p>
          <GenerateError error={error} />
        </div>
      </div>

      <GeneratedPreview videoUrl={videoUrl} demoNotice={demoNotice} />
      <PreviousVideos talkingPhotoId={profile.selectedTalkingPhoto} />
    </div>
  );
}

export function useGenerate() {
  const profile = useProfileStore((state) => state.profile);
  const router = useRouter();
  const [itemDetails, setItemDetails] = useState<DIDTalkingPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [useFallbackImage, setUseFallbackImage] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  useEffect(() => {
    const selectedId = profile.selectedTalkingPhoto;
    const hasDidKey = profileHasDidKey(
      profile.did_api_key,
      profile.did_basic_auth
    );
    if (
      !hasDidKey &&
      (!selectedId || isBuiltinDemoAvatar(selectedId))
    ) {
      setItemDetails(builtinDemoAvatar());
      setFetchError(null);
      setLoading(false);
      return;
    }
    if (!selectedId) {
      setFetchError("No avatar selected. Please select an avatar first.");
      setLoading(false);
      setItemDetails(null);
      return;
    }

    setLoading(true);
    setFetchError(null);
    const docRef = doc(db, "didTalkingPhotos", selectedId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setItemDetails(docSnap.data() as DIDTalkingPhoto);
          setFetchError(null);
        } else {
          setItemDetails(null);
          setFetchError("Selected avatar not found.");
        }
        setLoading(false);
      },
      () => {
        setFetchError("Failed to load avatar details.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [
    profile.did_api_key,
    profile.did_basic_auth,
    profile.selectedTalkingPhoto,
  ]);

  const handleUseFallback = () => {
    setUseFallbackImage(true);
  };

  const handleGenerate = () =>
    submitGenerate({
      profile,
      itemDetails,
      script,
      useFallbackImage,
      setError,
      setIsGenerating,
      setDemoNotice,
      setVideoUrl,
      router,
    });

  return (
    <GenerateScreen
      loading={loading}
      fetchError={fetchError}
      useFallbackImage={useFallbackImage}
      setUseFallbackImage={setUseFallbackImage}
      handleUseFallback={handleUseFallback}
      itemDetails={itemDetails}
      profile={profile}
      script={script}
      setScript={setScript}
      handleGenerate={handleGenerate}
      isGenerating={isGenerating}
      error={error}
      videoUrl={videoUrl}
      demoNotice={demoNotice}
    />
  );
}

export default function Generate() {
  return useGenerate();
}
