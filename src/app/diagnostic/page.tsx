"use client";

import { useState, useEffect } from "react";
import { getApiBaseUrl, saveNgrokUrl } from "@/libs/utils";
import Link from "next/link";

export default function DiagnosticPage() {
  const [environment, setEnvironment] = useState<{
    baseUrl: string;
    isNgrok: boolean;
    isLocalhost: boolean;
    hostname: string;
    origin: string;
  }>({
    baseUrl: "",
    isNgrok: false,
    isLocalhost: false,
    hostname: "",
    origin: "",
  });

  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function detectEnvironment() {
      try {
        const baseUrl = getApiBaseUrl();
        const hostname = window.location.hostname;
        const origin = window.location.origin;
        const isNgrok = origin.includes("ngrok");
        const isLocalhost = hostname === "localhost";

        setEnvironment({
          baseUrl,
          isNgrok,
          isLocalhost,
          hostname,
          origin,
        });

        // Also fetch debug info
        const response = await fetch("/api/debug");
        if (response.ok) {
          const data = await response.json();
          setDebugInfo(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        console.error("Error detecting environment:", err);
      } finally {
        setLoading(false);
      }
    }

    detectEnvironment();
  }, []);

  const getStatusIndicator = (condition: boolean, text: string) => (
    <div
      className={`flex items-center gap-2 ${
        condition ? "text-green-600" : "text-red-600"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full ${
          condition ? "bg-green-500" : "bg-red-500"
        }`}
      ></span>
      <span>{text}</span>
    </div>
  );

  if (loading) {
    return <div className="p-8">Loading diagnostic information...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  const hasIssues = environment.isLocalhost || !environment.isNgrok;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">D-ID API Demo Diagnostics</h1>

      <div className="mb-8 p-4 rounded-lg bg-gray-50 border">
        <h2 className="text-xl font-bold mb-4">Environment Status</h2>

        <div className="space-y-3">
          {getStatusIndicator(
            !environment.isLocalhost,
            environment.isLocalhost
              ? "You're currently using localhost - Use ngrok URL instead"
              : "Not using localhost ✓"
          )}

          {getStatusIndicator(
            environment.isNgrok,
            environment.isNgrok
              ? "Using ngrok URL ✓"
              : "Not using ngrok URL - Required for D-ID API"
          )}

          {getStatusIndicator(
            environment.baseUrl === environment.origin,
            environment.baseUrl === environment.origin
              ? "Base URL matches current origin ✓"
              : "Base URL doesn't match current origin - this may cause issues"
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm font-mono">
          <p>
            <strong>Current URL:</strong> {environment.origin}
          </p>
          <p>
            <strong>API Base URL:</strong> {environment.baseUrl}
          </p>
        </div>
      </div>

      {hasIssues && (
        <div className="mb-8 p-4 rounded-lg bg-amber-50 border-l-4 border-amber-500">
          <h2 className="text-xl font-bold mb-2">Issues Detected</h2>
          <div className="space-y-3">
            {environment.isLocalhost && (
              <div>
                <h3 className="font-bold">Using localhost</h3>
                <p className="mb-2">
                  D-ID API cannot access localhost URLs. You need to access your
                  app through ngrok.
                </p>
                <Link href="/ngrok-setup" className="text-blue-600 underline">
                  View ngrok setup guide
                </Link>
              </div>
            )}

            {!environment.isNgrok && (
              <div>
                <h3 className="font-bold">Not using ngrok</h3>
                <p className="mb-2">
                  For local development, you need to access this application
                  through an ngrok URL.
                </p>
                <Link href="/ngrok-setup" className="text-blue-600 underline">
                  View ngrok setup guide
                </Link>
              </div>
            )}

            {environment.baseUrl !== environment.origin && (
              <div>
                <h3 className="font-bold">Base URL mismatch</h3>
                <p className="mb-2">
                  Your stored base URL doesn&apos;t match your current URL. This
                  may cause issues with image proxying.
                </p>
                <button
                  onClick={() => {
                    saveNgrokUrl();
                    setEnvironment({
                      ...environment,
                      baseUrl: environment.origin,
                    });
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
                >
                  Update Base URL to Current Origin
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-3">Diagnostic Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/test-image-access"
              className="block p-4 border rounded-lg hover:bg-gray-50"
            >
              <h3 className="font-bold">Test Image Accessibility</h3>
              <p className="text-sm text-gray-600">
                Test if D-ID API can access your images (required for video
                generation)
              </p>
            </Link>

            <Link
              href="/ngrok-setup"
              className="block p-4 border rounded-lg hover:bg-gray-50"
            >
              <h3 className="font-bold">ngrok Setup Guide</h3>
              <p className="text-sm text-gray-600">
                View detailed instructions for setting up ngrok correctly
              </p>
            </Link>

            <Link
              href="/test-proxy"
              className="block p-4 border rounded-lg hover:bg-gray-50"
            >
              <h3 className="font-bold">Test Proxy Implementation</h3>
              <p className="text-sm text-gray-600">
                Test the image proxy implementation for avatars
              </p>
            </Link>

            <Link
              href="/test-video-proxy"
              className="block p-4 border rounded-lg hover:bg-gray-50"
            >
              <h3 className="font-bold">Test Video Proxy</h3>
              <p className="text-sm text-gray-600">
                Test the video image proxy implementation
              </p>
            </Link>
          </div>
        </div>

        {debugInfo && (
          <div>
            <h2 className="text-xl font-bold mb-3">
              Detailed Debug Information
            </h2>
            <div className="overflow-auto bg-gray-100 p-4 rounded-lg">
              <pre className="text-xs font-mono">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold mb-3">Common Issues & Solutions</h2>
          <div className="space-y-4">
            <div className="p-3 border rounded-lg">
              <h3 className="font-bold">Error Generating Video</h3>
              <p className="text-sm">
                The most common cause is that D-ID API cannot access your images
                because you&apos;re using localhost instead of ngrok.
              </p>
              <p className="text-sm mt-1 font-bold">
                Solution: Access the app through your ngrok URL, not localhost.
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <h3 className="font-bold">Image Proxy Not Working</h3>
              <p className="text-sm">
                If your images aren&apos;t loading through the proxy, check the
                browser console for errors.
              </p>
              <p className="text-sm mt-1 font-bold">
                Solution: Use the Test Image Accessibility tool above to
                diagnose the issue.
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <h3 className="font-bold">API Key Errors</h3>
              <p className="text-sm">
                Make sure you&apos;ve entered your D-ID and ElevenLabs API keys
                in your profile.
              </p>
              <p className="text-sm mt-1 font-bold">
                Solution: Go to your profile settings and add your API keys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
