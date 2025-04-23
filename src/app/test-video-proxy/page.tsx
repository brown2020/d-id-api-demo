"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl, videoImageProxyUrl } from "@/libs/utils";

export default function TestVideoImageProxy() {
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [directFetchResult, setDirectFetchResult] = useState<string | null>(
    null
  );

  // Get the base URL that will be used for the proxy
  const baseUrl = getApiBaseUrl();

  useEffect(() => {
    async function fetchVideoIds() {
      try {
        const response = await fetch("/api/video-ids");
        if (!response.ok) {
          throw new Error("Failed to fetch video IDs");
        }
        const data = await response.json();
        setVideoIds(data.videoIds || []);

        // If we have video IDs, select the first one
        if (data.videoIds?.length > 0) {
          setSelectedVideo(data.videoIds[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching video IDs:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchDebugInfo() {
      try {
        const response = await fetch("/api/debug");
        if (response.ok) {
          const data = await response.json();
          setDebugInfo(data);
        }
      } catch (error) {
        console.error("Error fetching debug info:", error);
      }
    }

    fetchVideoIds();
    fetchDebugInfo();
  }, []);

  const testDirectFetch = async () => {
    if (!selectedVideo) return;

    try {
      setDirectFetchResult("loading");
      const proxyUrl = videoImageProxyUrl(baseUrl, `${selectedVideo}.png`);

      // Test if we can fetch the image directly
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        const text = await response.text();
        setDirectFetchResult(
          `Error: ${response.status} ${response.statusText} - ${text.substring(
            0,
            100
          )}`
        );
        return;
      }

      // Check if we got an image or JSON (error)
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        const json = await response.json();
        setDirectFetchResult(`Got JSON response: ${JSON.stringify(json)}`);
      } else if (contentType?.includes("image/")) {
        setDirectFetchResult("Successfully fetched image!");
      } else {
        setDirectFetchResult(`Unknown content-type: ${contentType}`);
      }
    } catch (err) {
      setDirectFetchResult(
        `Fetch error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Video Image Proxy Test</h1>

      <div className="bg-gray-50 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
        <div className="text-sm font-mono overflow-x-auto">
          <p>
            <strong>Base URL being used:</strong> {baseUrl}
          </p>
          {debugInfo && (
            <pre className="mt-2 bg-gray-100 p-2 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {loading && <p>Loading video IDs...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Test Direct Fetch</h2>
            <div className="flex items-center gap-2 mb-4">
              <select
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
                onClick={testDirectFetch}
                disabled={!selectedVideo}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
              >
                Test Fetch
              </button>
            </div>

            {directFetchResult && (
              <div
                className={`p-3 rounded ${
                  directFetchResult === "loading"
                    ? "bg-blue-100"
                    : directFetchResult.startsWith("Error") ||
                      directFetchResult.startsWith("Fetch error")
                    ? "bg-red-100"
                    : "bg-green-100"
                }`}
              >
                {directFetchResult === "loading"
                  ? "Testing..."
                  : directFetchResult}
              </div>
            )}

            {selectedVideo && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Proxy URL:</p>
                <code className="text-xs bg-gray-100 p-1 rounded block break-all">
                  {videoImageProxyUrl(baseUrl, `${selectedVideo}.png`)}
                </code>
              </div>
            )}
          </div>

          <h2 className="text-lg font-semibold mb-2">Image Display Test</h2>
          <p className="mb-4">Found {videoIds.length} videos</p>

          {videoIds.length === 0 ? (
            <p className="text-amber-600">
              No videos found. Create a video first to test the image proxy.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videoIds.map((id) => (
                <div key={id} className="border p-4 rounded">
                  <h2 className="text-lg font-semibold mb-2">Video ID: {id}</h2>

                  <div className="mb-4">
                    <h3 className="font-medium mb-1">Via Video Image Proxy:</h3>
                    <img
                      src={videoImageProxyUrl(baseUrl, `${id}.png`)}
                      alt={`Video ${id} via proxy`}
                      className="max-w-full h-auto border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://placehold.co/400x400?text=Error+Loading+Image";
                        target.title = "Failed to load image via proxy";
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
