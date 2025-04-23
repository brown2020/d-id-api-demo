"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl, imageProxyUrl, videoImageProxyUrl } from "@/libs/utils";
import { DIDTalkingPhoto } from "@/types/did";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { DOCUMENT_COLLECTION } from "@/libs/constants";

export default function TestImageAccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [avatars, setAvatars] = useState<DIDTalkingPhoto[]>([]);
  const [testInProgress, setTestInProgress] = useState(false);

  const baseUrl = getApiBaseUrl();

  useEffect(() => {
    async function fetchAvatars() {
      try {
        const querySnapshot = await getDocs(
          collection(db, DOCUMENT_COLLECTION)
        );
        const avatars = querySnapshot.docs.map(
          (doc) => doc.data() as DIDTalkingPhoto
        );
        setAvatars(avatars);
      } catch (err) {
        setError(
          "Failed to fetch avatars: " +
            (err instanceof Error ? err.message : String(err))
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAvatars();
  }, []);

  const testImageAccess = async () => {
    setTestInProgress(true);
    setTestResults([]);

    const results = [];

    // 1. Test direct image access
    for (const avatar of avatars.slice(0, 3)) {
      // Test max 3 avatars
      try {
        const imgUrl = avatar.preview_image_url;
        const proxyUrl = imageProxyUrl(
          baseUrl,
          `${avatar.talking_photo_id}.png`
        );

        // Test 1: Original image URL
        const originalResult = await testFetch(imgUrl);

        // Test 2: Proxy URL
        const proxyResult = await testFetch(proxyUrl);

        // Test 3: Server-side proxy test
        const serverTest = await fetch(
          `/api/test-image-access?url=${encodeURIComponent(proxyUrl)}`
        );
        const serverResult = await serverTest.json();

        results.push({
          avatar: avatar.talking_photo_name,
          id: avatar.talking_photo_id,
          originalUrl: {
            url: imgUrl,
            ...originalResult,
          },
          proxyUrl: {
            url: proxyUrl,
            ...proxyResult,
          },
          serverTest: serverResult,
        });
      } catch (error) {
        results.push({
          avatar: avatar.talking_photo_name,
          id: avatar.talking_photo_id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    setTestResults(results);
    setTestInProgress(false);
  };

  const testFetch = async (url: string) => {
    try {
      const startTime = Date.now();
      const response = await fetch(url, { method: "HEAD" });
      const endTime = Date.now();

      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        timeMs: endTime - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Image Accessibility Test</h1>
      <p className="mb-4 text-gray-600">
        This tool tests if images are accessible for the D-ID API, which can
        help diagnose video generation issues.
      </p>

      <div className="p-4 bg-blue-50 rounded-lg mb-6">
        <h2 className="font-semibold">Environment Information</h2>
        <div className="mt-2 font-mono text-sm">
          <p>API Base URL: {baseUrl}</p>
          <p>
            Running locally:{" "}
            {window.location.hostname === "localhost" ? "Yes" : "No"}
          </p>
          <p>Current URL: {window.location.href}</p>
        </div>
      </div>

      {loading ? (
        <p>Loading avatars...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <div className="mb-6">
            <p>Found {avatars.length} avatars in database</p>
            <button
              onClick={testImageAccess}
              disabled={testInProgress}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              {testInProgress ? "Testing..." : "Test Image Access"}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold">Test Results</h2>

              {testResults.map((result, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h3 className="font-bold">
                    {result.avatar} ({result.id})
                  </h3>

                  {result.error ? (
                    <p className="text-red-500 mt-2">{result.error}</p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-semibold">Original Image URL</h4>
                        <p className="text-xs mt-1 font-mono break-all">
                          {result.originalUrl.url}
                        </p>
                        {result.originalUrl.success ? (
                          <p className="mt-2 text-green-600">
                            ✓ Accessible ({result.originalUrl.timeMs}ms) -{" "}
                            {result.originalUrl.contentType}
                          </p>
                        ) : (
                          <p className="mt-2 text-red-600">
                            ✗ Not accessible -{" "}
                            {result.originalUrl.error ||
                              `${result.originalUrl.status} ${result.originalUrl.statusText}`}
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-semibold">Proxy Image URL</h4>
                        <p className="text-xs mt-1 font-mono break-all">
                          {result.proxyUrl.url}
                        </p>
                        {result.proxyUrl.success ? (
                          <p className="mt-2 text-green-600">
                            ✓ Accessible from browser ({result.proxyUrl.timeMs}
                            ms) - {result.proxyUrl.contentType}
                          </p>
                        ) : (
                          <p className="mt-2 text-red-600">
                            ✗ Not accessible from browser -{" "}
                            {result.proxyUrl.error ||
                              `${result.proxyUrl.status} ${result.proxyUrl.statusText}`}
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-semibold">Server-Side Test</h4>
                        {result.serverTest.success ? (
                          <p className="mt-2 text-green-600">
                            ✓ Accessible from server -{" "}
                            {result.serverTest.contentType}
                          </p>
                        ) : (
                          <p className="mt-2 text-red-600">
                            ✗ Not accessible from server -{" "}
                            {result.serverTest.error}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="p-4 border-t mt-6">
                <h3 className="font-semibold">What This Means</h3>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>
                    If images are accessible in the browser but not from the
                    server, you likely need to use ngrok.
                  </li>
                  <li>
                    If proxy URLs aren't accessible at all, there's an issue
                    with your proxy implementation.
                  </li>
                  <li>
                    For D-ID API to work, the images must be accessible from
                    external servers.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
