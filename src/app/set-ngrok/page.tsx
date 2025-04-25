"use client";

import { useState, useEffect } from "react";
import { saveNgrokUrl } from "@/libs/utils";

export default function SetNgrokUrl() {
  const [ngrokUrl, setNgrokUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Get the saved URL from localStorage
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("ngrok_url");
      if (savedUrl) {
        setCurrentUrl(savedUrl);
      }
    }
  }, []);

  const handleSave = () => {
    if (!ngrokUrl) return;

    // Ensure URL has proper format
    let formattedUrl = ngrokUrl;
    if (!formattedUrl.startsWith("http")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Remove trailing slash if present
    if (formattedUrl.endsWith("/")) {
      formattedUrl = formattedUrl.slice(0, -1);
    }

    saveNgrokUrl();
    setCurrentUrl(formattedUrl);
    setSaved(true);

    // Reset saved status after 3 seconds
    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Set ngrok URL</h1>

      {currentUrl && (
        <div className="mb-6 p-4 bg-gray-100 rounded-sm">
          <h2 className="text-lg font-medium mb-2">Current ngrok URL:</h2>
          <div className="break-all font-mono">{currentUrl}</div>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="ngrokUrl" className="block text-sm font-medium mb-2">
          Enter your new ngrok URL:
        </label>
        <input
          type="text"
          id="ngrokUrl"
          value={ngrokUrl}
          onChange={(e) => setNgrokUrl(e.target.value)}
          placeholder="e.g., https://a1b2c3d4.ngrok-free.app"
          className="w-full p-2 border border-gray-300 rounded-sm"
        />
      </div>

      <button
        onClick={handleSave}
        className={`px-4 py-2 rounded ${
          saved
            ? "bg-green-500 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
        disabled={saved}
      >
        {saved ? "Saved!" : "Save ngrok URL"}
      </button>

      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-medium mb-2">Instructions:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Start ngrok with{" "}
            <code className="bg-gray-100 px-1 rounded-sm">ngrok http 3000</code>
          </li>
          <li>
            Copy the forwarding URL (e.g.,{" "}
            <code className="bg-gray-100 px-1 rounded-sm">
              https://a1b2c3d4.ngrok-free.app
            </code>
            )
          </li>
          <li>Paste it above and click Save</li>
          <li>The D-ID API should now be able to access your proxied images</li>
        </ol>
      </div>
    </div>
  );
}
