"use client";

import { useState } from "react";
import { getApiBaseUrl, imageProxyUrl } from "@/libs/utils";
import Image from "next/image";

export default function TestImageProxy() {
  const [avatarIds, setAvatarIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [directFetchResult, setDirectFetchResult] = useState<string | null>(null);
  const baseUrl = getApiBaseUrl();

  const loadProxyTest = () => {
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const response = await fetch("/api/avatar-ids");
        if (!response.ok) throw new Error("Failed to fetch IDs");
        const data = await response.json();
        setAvatarIds(data.avatarIds ?? []);
        if (data.avatarIds?.length > 0) setSelectedAvatar(data.avatarIds[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  };

  const testDirectFetch = async () => {
    if (!selectedAvatar) return;
    setDirectFetchResult("loading");
    const proxyUrl = imageProxyUrl(baseUrl, `${selectedAvatar}.png`);
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
      <h1 className="text-2xl font-bold">Image Proxy Test</h1>
      <p className="text-sm text-gray-600">Base URL: {baseUrl}</p>
      <button
        type="button"
        className="px-3 py-2 bg-blue-600 text-white rounded"
        onClick={loadProxyTest}
      >
        Load avatar IDs
      </button>
      {loading ? <p>Loading...</p> : null}
      {error ? <p className="text-red-500">{error}</p> : null}
      <div className="flex items-center gap-2">
        <label htmlFor="avatar-select" className="text-sm">
          Avatar
        </label>
        <select
          id="avatar-select"
          value={selectedAvatar || ""}
          onChange={(e) => setSelectedAvatar(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Select an avatar</option>
          {avatarIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={testDirectFetch}
          disabled={!selectedAvatar}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          Test Fetch
        </button>
      </div>
      {directFetchResult ? <p>Result: {directFetchResult}</p> : null}
      {selectedAvatar && directFetchResult === "ok" ? (
        <Image
          src={imageProxyUrl(baseUrl, `${selectedAvatar}.png`)}
          alt="Proxy preview"
          width={256}
          height={256}
        />
      ) : null}
    </div>
  );
}
