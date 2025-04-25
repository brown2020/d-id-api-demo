"use client";

import { useState } from "react";
import Link from "next/link";

export default function BasicAuthGenerator() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const generateBasicAuth = () => {
    if (!username || !password) {
      setResult("Please enter both username and password");
      return;
    }

    const credentials = `${username}:${password}`;
    const encoded = Buffer.from(credentials).toString("base64");
    setResult(`Basic ${encoded}`);
  };

  const copyToClipboard = () => {
    if (result && result.startsWith("Basic ")) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Basic Auth Header Generator</h1>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm text-blue-700">
          This tool converts your D-ID API credentials into the{" "}
          <code className="bg-blue-100 px-1">D_ID_BASIC_AUTH</code> format
          needed for Vercel deployment. Set this value in your Vercel project
          environment variables.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            API Key Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter username part of your D-ID API key"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            API Key Password
          </label>
          <input
            type="text"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter password part of your D-ID API key"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your complete API key should be in the format:{" "}
            <code className="bg-gray-100 px-1">username:password</code>
          </p>
        </div>

        <button
          onClick={generateBasicAuth}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Generate Basic Auth Header
        </button>
      </div>

      {result && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3">Result:</h2>
          <div className="bg-gray-50 p-4 rounded border relative">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>

            {result.startsWith("Basic ") && (
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {result.startsWith("Basic ") && (
            <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <h3 className="font-bold mb-2">Next Steps:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Copy the Basic Auth value above</li>
                <li>Go to your Vercel project dashboard</li>
                <li>Navigate to Settings &gt; Environment Variables</li>
                <li>
                  Add a new variable with name{" "}
                  <code className="bg-gray-100 px-1">D_ID_BASIC_AUTH</code> and
                  paste the value generated above
                </li>
                <li>Click Save and redeploy your project</li>
              </ol>
            </div>
          )}
        </div>
      )}

      <div className="flex space-x-4 mt-8">
        <Link href="/api-diagnostics" className="text-blue-600 hover:underline">
          Back to API Diagnostics
        </Link>
      </div>
    </div>
  );
}
