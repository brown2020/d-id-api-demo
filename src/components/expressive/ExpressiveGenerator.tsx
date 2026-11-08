"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useProfileStore from "@/zustand/useProfileStore";
import { listExpressiveAvatars } from "@/actions/expressiveAvatars";
import { createExpressiveVideo, syncExpressiveVideo } from "@/actions/expressiveVideos";
import type { ExpressiveAvatar, ExpressiveSentiment } from "@/types/did";
import { Loader2, Sparkles, Video } from "lucide-react";
import Image from "next/image";
import { initialSelection, sampleExpressiveAvatar, sampleSentiments } from "./expressive-avatar";

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

  const applyAvatars = useCallback((nextAvatars: ExpressiveAvatar[]) => {
    const selection = initialSelection(nextAvatars);
    setAvatars(nextAvatars);
    setSelectedAvatar(selection.avatar);
    setSelectedSentiment(selection.sentiment);
  }, []);

  const loadAvatars = useCallback(async () => {
    setLoading(true);
    if (!didApiKey && !didBasicAuth) {
      applyAvatars([sampleExpressiveAvatar("Demo Avatar (Sample)", sampleSentiments(true))]);
      setLoading(false);
      return;
    }

    const result = await listExpressiveAvatars(didApiKey, didBasicAuth);
    if (result.status && result.avatars) {
      applyAvatars(result.avatars);
    } else {
      applyAvatars([sampleExpressiveAvatar("Demo Avatar (API Error)", sampleSentiments(false))]);
    }
    setLoading(false);
  }, [applyAvatars, didApiKey, didBasicAuth]);

  useEffect(() => {
    void loadAvatars();
  }, [loadAvatars]);

  const handleAvatarSelect = (avatar: ExpressiveAvatar) => {
    setSelectedAvatar(avatar);
    setSelectedSentiment(avatar.sentiments[0] ?? null);
  };

  const handleGenerate = async () => {
    if (!selectedAvatar || !selectedSentiment || !scriptText.trim()) return;

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
      didBasicAuth,
    );

    if (result.status && result.videoId) {
      void pollExpressiveVideo(result.videoId, {
        setGenerating,
        setVideoUrl,
        setDemoMode,
        setDemoNotice,
        setPollingStatus,
      });
      return;
    }
    setGenerating(false);
    setPollingStatus(`Error: ${result.message}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasApiKey = !!(didApiKey || didBasicAuth);

  return (
    <ExpressiveStudio
      hasApiKey={hasApiKey}
      avatars={avatars}
      selectedAvatar={selectedAvatar}
      selectedSentiment={selectedSentiment}
      scriptText={scriptText}
      generating={generating}
      pollingStatus={pollingStatus}
      demoMode={demoMode}
      demoNotice={demoNotice}
      videoUrl={videoUrl}
      onSelectAvatar={handleAvatarSelect}
      onSelectSentiment={setSelectedSentiment}
      onScriptChange={setScriptText}
      onGenerate={handleGenerate}
    />
  );
}

function pollExpressiveVideo(
  videoId: string,
  actions: {
    setGenerating: (value: boolean) => void;
    setVideoUrl: (value: string | null) => void;
    setDemoMode: (value: boolean) => void;
    setDemoNotice: (value: string | null) => void;
    setPollingStatus: (value: string | null) => void;
  },
) {
  let attempts = 0;
  const maxAttempts = 60;

  const poll = async () => {
    if (attempts >= maxAttempts) {
      actions.setPollingStatus("Timeout: Video generation took too long");
      actions.setGenerating(false);
      return;
    }

    attempts += 1;
    actions.setPollingStatus(`Checking status... (${attempts}/${maxAttempts})`);
    const syncResult = await syncExpressiveVideo(videoId);
    if (!syncResult.status) {
      actions.setPollingStatus(`Error: ${syncResult.message}`);
      actions.setGenerating(false);
      return;
    }

    const videoRef = await fetch(`/api/expressive-video/${videoId}`);
    if (videoRef.ok) {
      const videoData = await videoRef.json();
      const finished = applyVideoStatus(videoData, actions);
      if (finished) return;
    }

    setTimeout(poll, 5000);
  };

  void poll();
}

function applyVideoStatus(
  videoData: {
    demo_mode?: boolean;
    demo_notice?: string | null;
    result_url?: string;
    status?: string;
    errorMessage?: string;
  },
  actions: {
    setGenerating: (value: boolean) => void;
    setVideoUrl: (value: string | null) => void;
    setDemoMode: (value: boolean) => void;
    setDemoNotice: (value: string | null) => void;
    setPollingStatus: (value: string | null) => void;
  },
): boolean {
  if (videoData.demo_mode) {
    actions.setDemoMode(true);
    actions.setDemoNotice(videoData.demo_notice ?? null);
    actions.setVideoUrl(videoData.result_url ?? null);
    actions.setPollingStatus("Demo video ready");
    actions.setGenerating(false);
    return true;
  }
  if (videoData.status === "done" && videoData.result_url) {
    actions.setVideoUrl(videoData.result_url);
    actions.setPollingStatus("Video ready!");
    actions.setGenerating(false);
    return true;
  }
  if (videoData.status === "error") {
    actions.setPollingStatus(`Error: ${videoData.errorMessage || "Generation failed"}`);
    actions.setGenerating(false);
    return true;
  }
  return false;
}

function ExpressiveStudio(props: {
  hasApiKey: boolean;
  avatars: ExpressiveAvatar[];
  selectedAvatar: ExpressiveAvatar | null;
  selectedSentiment: ExpressiveSentiment | null;
  scriptText: string;
  generating: boolean;
  pollingStatus: string | null;
  demoMode: boolean;
  demoNotice: string | null;
  videoUrl: string | null;
  onSelectAvatar: (avatar: ExpressiveAvatar) => void;
  onSelectSentiment: (sentiment: ExpressiveSentiment) => void;
  onScriptChange: (script: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="max-w-6xl mx-auto">
      <ExpressiveHeader hasApiKey={props.hasApiKey} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExpressiveControls {...props} />
        <ExpressivePreview {...props} />
      </div>
    </div>
  );
}

function ExpressiveHeader({ hasApiKey }: { hasApiKey: boolean }) {
  return (
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
            <Link href="/profile" className="underline hover:text-blue-900">Profile</Link> to access all avatars and create real videos.
          </p>
        </div>
      )}
    </div>
  );
}

function ExpressiveControls({
  avatars,
  selectedAvatar,
  selectedSentiment,
  scriptText,
  generating,
  onSelectAvatar,
  onSelectSentiment,
  onScriptChange,
  onGenerate,
}: {
  avatars: ExpressiveAvatar[];
  selectedAvatar: ExpressiveAvatar | null;
  selectedSentiment: ExpressiveSentiment | null;
  scriptText: string;
  generating: boolean;
  onSelectAvatar: (avatar: ExpressiveAvatar) => void;
  onSelectSentiment: (sentiment: ExpressiveSentiment) => void;
  onScriptChange: (script: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="space-y-6">
      <AvatarChoices avatars={avatars} selectedId={selectedAvatar?.id} onSelect={onSelectAvatar} />
      {selectedAvatar && selectedAvatar.sentiments.length > 0 && (
        <SentimentChoices
          sentiments={selectedAvatar.sentiments}
          selectedId={selectedSentiment?.id}
          onSelect={onSelectSentiment}
        />
      )}
      <div>
        <label htmlFor="expressive-script" className="text-xl font-semibold mb-4 block">
          3. Write Script
        </label>
        <textarea
          id="expressive-script"
          value={scriptText}
          onChange={(event) => onScriptChange(event.target.value)}
          placeholder="Enter the text for your avatar to speak..."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={onGenerate}
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
  );
}

function AvatarChoices({
  avatars,
  selectedId,
  onSelect,
}: {
  avatars: ExpressiveAvatar[];
  selectedId?: string;
  onSelect: (avatar: ExpressiveAvatar) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">1. Select Avatar</h2>
      <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {avatars.map((avatar) => (
          <ChoiceButton
            key={avatar.id}
            selected={selectedId === avatar.id}
            imageUrl={avatar.thumbnail_url}
            label={avatar.name}
            onClick={() => onSelect(avatar)}
          />
        ))}
      </div>
    </div>
  );
}

function SentimentChoices({
  sentiments,
  selectedId,
  onSelect,
}: {
  sentiments: ExpressiveSentiment[];
  selectedId?: string;
  onSelect: (sentiment: ExpressiveSentiment) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">2. Select Sentiment</h2>
      <div className="grid grid-cols-2 gap-4">
        {sentiments.map((sentiment) => (
          <ChoiceButton
            key={sentiment.id}
            selected={selectedId === sentiment.id}
            imageUrl={sentiment.thumbnail_url}
            label={sentiment.name}
            onClick={() => onSelect(sentiment)}
          />
        ))}
      </div>
    </div>
  );
}

function ChoiceButton({
  selected,
  imageUrl,
  label,
  onClick,
}: {
  selected: boolean;
  imageUrl: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 border-2 rounded-lg transition-colors ${
        selected ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="relative w-full aspect-square mb-2">
        <Image src={imageUrl} alt={label} fill className="object-cover rounded" unoptimized />
      </div>
      <p className="text-sm font-medium text-center">{label}</p>
    </button>
  );
}

function ExpressivePreview({
  selectedAvatar,
  selectedSentiment,
  pollingStatus,
  demoMode,
  demoNotice,
  videoUrl,
}: {
  selectedAvatar: ExpressiveAvatar | null;
  selectedSentiment: ExpressiveSentiment | null;
  pollingStatus: string | null;
  demoMode: boolean;
  demoNotice: string | null;
  videoUrl: string | null;
}) {
  return (
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
  );
}
