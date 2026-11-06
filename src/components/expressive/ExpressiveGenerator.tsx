"use client";

import { useState, useEffect, useCallback } from "react";
import useProfileStore from "@/zustand/useProfileStore";
import { listExpressiveAvatars } from "@/actions/expressiveAvatars";
import { createExpressiveVideo, syncExpressiveVideo } from "@/actions/expressiveVideos";
import { ExpressiveAvatar, ExpressiveSentiment } from "@/types/did";
import { Loader2, Sparkles, Video } from "lucide-react";
import Image from "next/image";

export default function ExpressiveGenerator() {
  const profile = useProfileStore((state) => state.profile);
  const { did_api_key: didApiKey, did_basic_auth: didBasicAuth } = profile;
  const [avatars, setAvatars] = useState<ExpressiveAvatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<ExpressiveAvatar | null>(null);
  const [selectedSentiment, setSelectedSentiment] = useState<ExpressiveSentiment | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const loadAvatars = useCallback(async () => {
    setLoading(true);
    
    if (!didApiKey && !didBasicAuth) {
      const demoAvatar: ExpressiveAvatar = {
        id: "demo_avatar",
        name: "Demo Avatar (Sample)",
        thumbnail_url: "/demo/sample-talking-avatar.png",
        provider_details: {
          provider: "demo"
        },
        sentiments: [
          {
            id: "demo_sentiment_professional",
            name: "Professional",
            thumbnail_url: "/demo/sample-talking-avatar.png",
            voice: { type: "demo" }
          },
          {
            id: "demo_sentiment_friendly",
            name: "Friendly",
            thumbnail_url: "/demo/sample-talking-avatar.png",
            voice: { type: "demo" }
          }
        ]
      };
      setAvatars([demoAvatar]);
      setSelectedAvatar(demoAvatar);
      setSelectedSentiment(demoAvatar.sentiments[0]);
      setLoading(false);
      return;
    }
    
    const result = await listExpressiveAvatars(didApiKey, didBasicAuth);
    if (result.status && result.avatars) {
      setAvatars(result.avatars);
      if (result.avatars.length > 0) {
        setSelectedAvatar(result.avatars[0]);
        if (result.avatars[0].sentiments.length > 0) {
          setSelectedSentiment(result.avatars[0].sentiments[0]);
        }
      }
    } else {
      const demoAvatar: ExpressiveAvatar = {
        id: "demo_avatar",
        name: "Demo Avatar (API Error)",
        thumbnail_url: "/demo/sample-talking-avatar.png",
        provider_details: {
          provider: "demo"
        },
        sentiments: [
          {
            id: "demo_sentiment_professional",
            name: "Professional",
            thumbnail_url: "/demo/sample-talking-avatar.png",
            voice: { type: "demo" }
          }
        ]
      };
      setAvatars([demoAvatar]);
      setSelectedAvatar(demoAvatar);
      setSelectedSentiment(demoAvatar.sentiments[0]);
    }
    setLoading(false);
  }, [didApiKey, didBasicAuth]);

  useEffect(() => {
    loadAvatars();
  }, [loadAvatars]);

  const handleAvatarSelect = (avatar: ExpressiveAvatar) => {
    setSelectedAvatar(avatar);
    if (avatar.sentiments.length > 0) {
      setSelectedSentiment(avatar.sentiments[0]);
    } else {
      setSelectedSentiment(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAvatar || !selectedSentiment || !scriptText.trim()) {
      return;
    }

    setGenerating(true);
    setVideoUrl(null);
    setDemoMode(false);
    setDemoNotice(null);
    setPollingStatus("Creating video...");

    const result = await createExpressiveVideo(
      selectedAvatar.id,
      selectedSentiment.id,
      scriptText,
      didApiKey,
      didBasicAuth
    );

    if (result.status && result.videoId) {
      startPolling(result.videoId);
    } else {
      setGenerating(false);
      setPollingStatus(`Error: ${result.message}`);
    }
  };

  const startPolling = async (vId: string) => {
    let attempts = 0;
    const maxAttempts = 60;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setPollingStatus("Timeout: Video generation took too long");
        setGenerating(false);
        return;
      }

      attempts++;
      setPollingStatus(`Checking status... (${attempts}/${maxAttempts})`);

      const syncResult = await syncExpressiveVideo(vId);

      if (!syncResult.status) {
        setPollingStatus(`Error: ${syncResult.message}`);
        setGenerating(false);
        return;
      }

      const videoRef = await fetch(`/api/expressive-video/${vId}`);
      if (videoRef.ok) {
        const videoData = await videoRef.json();

        if (videoData.demo_mode) {
          setDemoMode(true);
          setDemoNotice(videoData.demo_notice);
          setVideoUrl(videoData.result_url);
          setPollingStatus("Demo video ready");
          setGenerating(false);
          return;
        }

        if (videoData.status === "done" && videoData.result_url) {
          setVideoUrl(videoData.result_url);
          setPollingStatus("Video ready!");
          setGenerating(false);
          return;
        }

        if (videoData.status === "error") {
          setPollingStatus(`Error: ${videoData.errorMessage || "Generation failed"}`);
          setGenerating(false);
          return;
        }
      }

      setTimeout(poll, 5000);
    };

    poll();
  };

  const hasApiKey = !!(didApiKey || didBasicAuth);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-blue-600" />
          V4 Expressive Avatars
        </h1>
        <p className="text-gray-600">
          Create videos with emotional avatars that express different sentiments
        </p>
        {!hasApiKey && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Demo Mode:</strong> You&apos;re viewing a sample avatar. Add your D-ID API key in{" "}
              <a href="/profile" className="underline hover:text-blue-900">Profile</a> to access all avatars and create real videos.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">1. Select Avatar</h2>
            <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {avatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedAvatar?.id === avatar.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="relative w-full aspect-square mb-2">
                    <Image
                      src={avatar.thumbnail_url}
                      alt={avatar.name}
                      fill
                      className="object-cover rounded"
                      unoptimized
                    />
                  </div>
                  <p className="text-sm font-medium text-center">{avatar.name}</p>
                </button>
              ))}
            </div>
          </div>

          {selectedAvatar && selectedAvatar.sentiments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">2. Select Sentiment</h2>
              <div className="grid grid-cols-2 gap-4">
                {selectedAvatar.sentiments.map((sentiment) => (
                  <button
                    key={sentiment.id}
                    onClick={() => setSelectedSentiment(sentiment)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedSentiment?.id === sentiment.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="relative w-full aspect-square mb-2">
                      <Image
                        src={sentiment.thumbnail_url}
                        alt={sentiment.name}
                        fill
                        className="object-cover rounded"
                        unoptimized
                      />
                    </div>
                    <p className="text-sm font-medium text-center">{sentiment.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">3. Write Script</h2>
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Enter the text for your avatar to speak..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedAvatar || !selectedSentiment || !scriptText.trim() || generating}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                Generate Video
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            {selectedAvatar && selectedSentiment ? (
              <div className="space-y-4">
                <div className="relative w-full aspect-video">
                  <Image
                    src={selectedSentiment.thumbnail_url}
                    alt={`${selectedAvatar.name} - ${selectedSentiment.name}`}
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Avatar:</strong> {selectedAvatar.name}
                  </p>
                  <p>
                    <strong>Sentiment:</strong> {selectedSentiment.name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select an avatar and sentiment to preview
              </div>
            )}
          </div>

          {pollingStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">{pollingStatus}</p>
            </div>
          )}

          {demoMode && demoNotice && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">{demoNotice}</p>
            </div>
          )}

          {videoUrl && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Generated Video</h3>
              <video controls className="w-full rounded-lg">
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
