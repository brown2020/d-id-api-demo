"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LocalhostWarningProps {
  onUseFallback: () => void;
}

export default function LocalhostWarning({
  onUseFallback,
}: LocalhostWarningProps) {
  const [show, setShow] = useState(false);
  const [environmentInfo, setEnvironmentInfo] = useState({
    isLocalhost: false,
    isNgrok: false,
    isVercel: false,
    origin: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const hostname = window.location.hostname;

      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
      const isNgrok = origin.includes("ngrok");
      const isVercel = origin.includes("vercel.app");

      setEnvironmentInfo({
        isLocalhost,
        isNgrok,
        isVercel,
        origin,
      });

      // Show warning on localhost or if not on a verified domain
      const shouldShowWarning = isLocalhost || (!isNgrok && !isVercel);
      if (shouldShowWarning) {
        setShow(true);
      }
    }
  }, []);

  if (!show) return null;

  return (
    <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-4">
      <div className="flex items-start">
        <div className="shrink-0">
          <svg
            className="h-5 w-5 text-orange-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-orange-700">
            <strong>Image Accessibility Warning:</strong>{" "}
            {environmentInfo.isLocalhost
              ? "You're using localhost, but the D-ID API requires a publicly accessible URL for images."
              : "Your environment may have issues with image accessibility for the D-ID API."}
            <br />
            <span className="mt-1 block">
              Current environment:{" "}
              <code className="bg-orange-50 px-1 rounded-sm">
                {environmentInfo.origin}
              </code>
              (
              {environmentInfo.isLocalhost
                ? "localhost"
                : environmentInfo.isNgrok
                ? "ngrok"
                : environmentInfo.isVercel
                ? "Vercel"
                : "unknown"}
              )
            </span>
            <span className="mt-1 block">
              To prevent video generation errors, you can:
            </span>
            <ul className="list-disc pl-5 mt-1 mb-2">
              {environmentInfo.isLocalhost && (
                <li>
                  <strong>Recommended:</strong> Run ngrok with:{" "}
                  <code className="bg-orange-50 px-1 rounded-sm">
                    ngrok http 3000
                  </code>{" "}
                  and use that URL instead
                </li>
              )}
              <li>
                <button
                  onClick={onUseFallback}
                  className="text-blue-600 underline hover:text-blue-800 font-medium"
                >
                  Use fallback image
                </button>{" "}
                (reliable but doesn&apos;t use your custom avatar)
              </li>
              <li>
                Click the &quot;Test Image Accessibility&quot; button below to
                check if your image is accessible
              </li>
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href="/test-image-access"
                className="text-xs bg-orange-200 hover:bg-orange-300 px-2 py-1 rounded inline-block"
                target="_blank"
              >
                Test Image Access
              </Link>
              <Link
                href="/diagnostic"
                className="text-xs bg-orange-200 hover:bg-orange-300 px-2 py-1 rounded inline-block"
              >
                Run Diagnostics
              </Link>
            </div>
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => setShow(false)}
              className="inline-flex rounded-md p-1.5 text-orange-500 hover:bg-orange-200 focus:outline-hidden"
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
