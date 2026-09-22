"use client";

import { useState } from "react";
import { getApiBaseUrl, imageProxyUrl } from "@/libs/utils";
import Image from "next/image";

export default function TestVideoProxy() {
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [directFetchResult, setDirectFetchResult] = useState<string | null>(null);
  const baseUrl = getApiBaseUrl();

  const loadVideoProxyTest = () => {
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const response = await fetch("/api/video-ids");
        if (!response.ok) throw new Error("Failed to fetch IDs");
        const data = await response.json();
        setVideoIds(data.videoIds ?? []);
        if (data.videoIds?.length > 0) setSelectedVideo(data.videoIds[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  };

  const testDirectFetch = async () => {
    if (!selectedVideo) return;
    setDirectFetchResult("loading");
    const proxyUrl = imageProxyUrl(baseUrl, `${selectedVideo}.png`);
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        setDirectFetchResult(`Error: ${response.status}`);
        return;
      }
      setDirectFetchResult("ok");
    } catch (err) {
      setDirectFetchResult(err instanceof Error ? err.message : "error");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Video Image Proxy Test</h1>
      <p className="text-sm text-gray-600">Base URL: {baseUrl}</p>
      <button
        type="button"
        className="px-3 py-2 bg-blue-600 text-white rounded"
        onClick={loadVideoProxyTest}
      >
        Load video IDs
      </button>
      {loading ? <p>Loading...</p> : null}
      {error ? <p className="text-red-500">{error}</p> : null}
      <div className="flex items-center gap-2">
        <label htmlFor="video-select" className="text-sm">
          Video
        </label>
        <select
          id="video-select"
          value={selectedVideo || ""}
          onChange={(e) => setSelectedVideo(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select a video</option>
          {videoIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={testDirectFetch}
          disabled={!selectedVideo}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          Test Fetch
        </button>
      </div>
      {directFetchResult ? <p>Result: {directFetchResult}</p> : null}
      {selectedVideo && directFetchResult === "ok" ? (
        <Image
          src={imageProxyUrl(baseUrl, `${selectedVideo}.png`)}
          alt="Proxy preview"
          width={256}
          height={256}
        />
      ) : null}
    </div>
  );
}
