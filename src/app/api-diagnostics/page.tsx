"use client";

import { useState, useEffect } from "react";
import useProfileStore from "../../zustand/useProfileStore";
import Link from "next/link";

interface Diagnostics {
  diagnostics: {
    d_id_api_key: {
      exists: boolean;
      length: number;
      format: {
        contains_colon: boolean;
        starts_with_basic: boolean;
        appears_valid: boolean;
      };
    };
    elevenlabs_api_key: {
      exists: boolean;
      length: number;
    };
    d_id_basic_auth: {
      exists: boolean;
      length: number;
      starts_with_basic: boolean;
    };
    environment: {
      node_env: string;
      vercel_env: string;
    };
  };
  recommendations: string[];
  timestamp: string;
}

export default function ApiDiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const profile = useProfileStore((state) => state.profile);

  useEffect(() => {
    async function fetchDiagnostics() {
      try {
        setLoading(true);
        const response = await fetch("/api/key-diagnostics");

        if (!response.ok) {
          throw new Error(`Failed to fetch diagnostics: ${response.status}`);
        }

        const data = await response.json();
        setDiagnostics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        console.error("Error fetching diagnostics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDiagnostics();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">API Key Diagnostics</h1>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h2 className="font-semibold">Your Profile API Keys</h2>
        <div className="mt-2">
          <p>
            D-ID API Key:{" "}
            {profile?.did_api_key ? (
              <span className="text-green-600">
                ✅ Set ({profile.did_api_key.length} characters)
              </span>
            ) : (
              <span className="text-red-600">❌ Not set</span>
            )}
          </p>
          <p>
            ElevenLabs API Key:{" "}
            {profile?.elevenlabs_api_key ? (
              <span className="text-green-600">
                ✅ Set ({profile.elevenlabs_api_key.length} characters)
              </span>
            ) : (
              <span className="text-yellow-600">⚠️ Not set (optional)</span>
            )}
          </p>

          {profile?.did_api_key &&
            !profile.did_api_key.includes(":") &&
            !profile.did_api_key.startsWith("Basic ") && (
              <div className="mt-2 text-red-600">
                <p>⚠️ Your D-ID API key format appears to be invalid.</p>
                <p>
                  It should contain a colon (:) to separate username and
                  password, or start with &quot;Basic &quot;.
                </p>
              </div>
            )}

          <div className="mt-4">
            <Link href="/profile" className="text-blue-600 hover:underline">
              Edit your API keys in Profile
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading server diagnostics...</p>
      ) : error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : diagnostics ? (
        <>
          <h2 className="text-xl font-bold mb-4">Server Environment</h2>
          <div className="bg-gray-50 p-4 rounded mb-6">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(diagnostics?.diagnostics?.environment, null, 2)}
            </pre>
          </div>

          <h2 className="text-xl font-bold mb-4">Recommendations</h2>
          <ul className="list-disc pl-5 mb-6">
            {diagnostics.recommendations.map((rec: string, i: number) => (
              <li key={i} className="mb-2">
                {rec}
              </li>
            ))}

            {!profile?.did_api_key && (
              <li className="text-red-600">
                Your profile does not have a D-ID API key set. Add one in your
                profile.
              </li>
            )}
          </ul>

          <h2 className="text-xl font-bold mb-4">Next Steps</h2>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded">
              <h3 className="font-bold mb-2">Common API Key Issues:</h3>
              <ul className="list-disc pl-5">
                <li>
                  Make sure your D-ID API key is in the format{" "}
                  <code className="bg-gray-100 px-1">username:password</code>
                </li>
                <li>
                  The API key should be copied directly from the D-ID dashboard
                </li>
                <li>
                  Avoid extra spaces, line breaks or other special characters
                </li>
                <li>
                  If using environment variables, ensure{" "}
                  <code className="bg-gray-100 px-1">D_ID_API_KEY</code> is set
                  correctly
                </li>
                <li>
                  For Vercel deployment, you might need to set{" "}
                  <code className="bg-gray-100 px-1">D_ID_BASIC_AUTH</code>
                  as{" "}
                  <code className="bg-gray-100 px-1">
                    Basic &lt;encoded-credentials&gt;
                  </code>{" "}
                  where
                  <code className="bg-gray-100 px-1">
                    &lt;encoded-credentials&gt;
                  </code>{" "}
                  is Base64 encoded
                  <code className="bg-gray-100 px-1">username:password</code>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-bold mb-2">Setting Up Authentication:</h3>
              <p className="mb-2">
                The app can use three different methods for D-ID API
                authentication:
              </p>
              <ol className="list-decimal pl-5 mb-3">
                <li>
                  Your profile&apos;s API key (recommended for regular users)
                </li>
                <li>
                  Environment variable{" "}
                  <code className="bg-gray-100 px-1">D_ID_API_KEY</code> in the
                  format{" "}
                  <code className="bg-gray-100 px-1">username:password</code>
                </li>
                <li>
                  Environment variable{" "}
                  <code className="bg-gray-100 px-1">D_ID_BASIC_AUTH</code> in
                  the format{" "}
                  <code className="bg-gray-100 px-1">
                    Basic &lt;encoded-credentials&gt;
                  </code>
                </li>
              </ol>
              <p className="mb-2">
                For production deployment on Vercel, option 3 is often most
                reliable.
              </p>
              <div className="mt-3">
                <Link
                  href="/basic-auth-generator"
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm rounded inline-block"
                >
                  Generate Basic Auth Header
                </Link>
                <span className="text-xs ml-2 text-gray-600">
                  (Use this to create your{" "}
                  <code className="bg-gray-100 px-1">D_ID_BASIC_AUTH</code>{" "}
                  value for Vercel)
                </span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-bold mb-2">Troubleshooting:</h3>
              <ul className="list-disc pl-5">
                <li>
                  Try using the &quot;Use fallback image&quot; option on the
                  Generate page
                </li>
                <li>
                  Visit the{" "}
                  <Link
                    href="/test-image-access"
                    className="text-blue-600 hover:underline"
                  >
                    Image Access Test
                  </Link>{" "}
                  page to verify image URLs
                </li>
                <li>
                  Check the browser console for more detailed error messages
                </li>
                <li>Clear browser cache and try again</li>
              </ul>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
