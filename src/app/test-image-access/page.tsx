"use client";

import Link from "next/link";
import { useState } from "react";

export default function TestImageAccessPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string>("");

  const runCheck = () => {
    setResult("Checking...");
    const target = `/api/test-image-access?url=${encodeURIComponent(url)}`;
    fetch(target)
      .then(async (response) => {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
        setResult(text);
      })
      .catch((err: unknown) => {
        setResult(err instanceof Error ? err.message : String(err));
      });
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Test Image Access</h1>
      <p className="text-sm text-gray-600">
        Dev-only helper to HEAD-check whether an image URL is reachable by this
        app. Prefer allowlisted https hosts.
      </p>
      <label htmlFor="image-url" className="block text-sm font-medium">
        Image URL
      </label>
      <input
        id="image-url"
        className="w-full border rounded px-3 py-2"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
      />
      <button
        type="button"
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={runCheck}
      >
        Check access
      </button>
      {result ? (
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">{result}</pre>
      ) : null}
      <Link href="/diagnostic" className="text-blue-600 underline text-sm">
        Back to diagnostics
      </Link>
    </div>
  );
}
