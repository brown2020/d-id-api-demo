"use client";

import { useState } from "react";
import { getApiBaseUrl, saveNgrokUrl } from "@/libs/utils";
import Image from "next/image";

export default function NgrokSetupGuide() {
  const [ngrokUrl, setNgrokUrl] = useState("");
  const [currentUrl, setCurrentUrl] = useState(getApiBaseUrl());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSaveNgrokUrl = () => {
    if (!ngrokUrl) {
      setError("Please enter a ngrok URL");
      return;
    }

    try {
      // Validate URL format
      const url = new URL(ngrokUrl);
      if (!url.hostname.includes("ngrok")) {
        setError("This doesn&apos;t appear to be a valid ngrok URL");
        return;
      }

      // Save the URL
      saveNgrokUrl(ngrokUrl);
      setCurrentUrl(ngrokUrl);
      setSaved(true);
      setError("");

      // Reset saved status after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(
        "Invalid URL format. Please enter a complete URL starting with https://"
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        Setting Up ngrok for D-ID API Demo
      </h1>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
        <p className="text-blue-700">
          <strong>Why ngrok is required:</strong> The D-ID API needs to access
          your image files via publicly accessible URLs. When running locally,
          your development server isn&apos;t accessible from the internet, which
          is why ngrok is necessary.
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold mb-4">Step 1: Install ngrok</h2>
          <ol className="list-decimal pl-6 space-y-3">
            <li>
              Go to{" "}
              <a
                href="https://ngrok.com/download"
                target="_blank"
                rel="noopener"
                className="text-blue-600 underline"
              >
                ngrok.com/download
              </a>{" "}
              and follow the installation instructions for your OS.
            </li>
            <li>
              Sign up for a free ngrok account if you don&apos;t have one.
            </li>
            <li>
              Connect your account by running the command shown in your ngrok
              dashboard.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">
            Step 2: Run your Next.js app
          </h2>
          <ol className="list-decimal pl-6 space-y-3">
            <li>
              Start your Next.js development server:
              <pre className="bg-gray-100 p-3 mt-2 rounded-sm font-mono">
                npm run dev
              </pre>
            </li>
            <li>
              Confirm your app is running at{" "}
              <code className="bg-gray-100 px-1 rounded-sm">
                http://localhost:3000
              </code>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Step 3: Start ngrok</h2>
          <ol className="list-decimal pl-6 space-y-3">
            <li>Open a new terminal window.</li>
            <li>
              Run ngrok to expose your local server:
              <pre className="bg-gray-100 p-3 mt-2 rounded-sm font-mono">
                ngrok http 3000
              </pre>
            </li>
            <li>
              You should see a screen showing the ngrok tunnel. Look for the
              &quot;Forwarding&quot; line.
            </li>
            <li>
              Copy the https URL (e.g.,{" "}
              <code className="bg-gray-100 px-1 rounded-sm">
                https://a1b2c3d4.ngrok-free.app
              </code>
              ).
            </li>
          </ol>
          <div className="border p-4 rounded-lg mt-4">
            <Image
              src="/ngrok-example.png"
              alt="ngrok terminal example"
              className="w-full rounded-sm border"
              width={800}
              height={400}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "https://ngrok.com/static/img/docs/ngrok-inspect.png";
              }}
            />
            <p className="text-sm text-gray-600 mt-2">
              Example of ngrok terminal output. Copy the https URL marked as
              &quot;Forwarding&quot;.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">
            Step 4: Access your app via ngrok
          </h2>
          <ol className="list-decimal pl-6 space-y-3">
            <li>
              Instead of using localhost:3000, open your application using the
              ngrok URL you copied.
            </li>
            <li>
              Enter that URL in your browser and verify the application loads
              correctly.
            </li>
            <li>Register the ngrok URL with this app by entering it below:</li>
          </ol>

          <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Current API Base URL</h3>
            <p className="font-mono bg-gray-100 p-2 rounded-sm break-all">
              {currentUrl}
            </p>

            <div className="mt-4">
              <label
                htmlFor="ngrokUrl"
                className="block text-sm font-medium mb-2"
              >
                Enter your ngrok URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="ngrokUrl"
                  value={ngrokUrl}
                  onChange={(e) => setNgrokUrl(e.target.value)}
                  placeholder="https://your-tunnel.ngrok-free.app"
                  className="flex-1 p-2 border rounded-sm"
                />
                <button
                  onClick={handleSaveNgrokUrl}
                  className={`px-4 py-2 rounded ${
                    saved
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                  disabled={saved}
                >
                  {saved ? "Saved!" : "Save URL"}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Step 5: Test your setup</h2>
          <ol className="list-decimal pl-6 space-y-3">
            <li>
              Go to{" "}
              <a href="/test-image-access" className="text-blue-600 underline">
                Image Access Test
              </a>{" "}
              to verify your images are accessible.
            </li>
            <li>If all tests pass, try generating a video again.</li>
          </ol>
        </section>

        <section className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <h2 className="text-lg font-bold mb-2">Important Notes</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              The free tier of ngrok will give you a{" "}
              <strong>new URL each time</strong> you restart it.
            </li>
            <li>
              You&apos;ll need to update the ngrok URL in this app each time you
              restart ngrok.
            </li>
            <li>
              Keep the ngrok terminal window open while using the application.
            </li>
            <li>
              For production use, consider deploying this application to a
              hosting service like Vercel.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">
                Images load in browser but not via D-ID API
              </h3>
              <p>
                Make sure you&apos;re accessing the application through the
                ngrok URL, not localhost.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">ngrok URL gives an error</h3>
              <p>
                Your ngrok session may have expired. Restart ngrok and update
                the URL.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Still having issues?</h3>
              <p>
                Check the browser console and server logs for specific error
                messages.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
