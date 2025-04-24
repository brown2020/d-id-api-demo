"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function NgrokReminder() {
  const [show, setShow] = useState(false);
  const [ngrokInfo, setNgrokInfo] = useState<{
    isNgrok: boolean;
    isLocalhost: boolean;
    origin: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const isNgrok =
        origin.includes("ngrok.io") || origin.includes("ngrok-free.app");
      const isLocalhost = origin.includes("localhost");

      // Store in localStorage if we're on ngrok
      if (isNgrok) {
        localStorage.setItem("ngrok_url", origin);
      }

      setNgrokInfo({
        isNgrok,
        isLocalhost,
        origin,
      });

      // Only show reminder if we're on localhost and not using ngrok
      // AND we don't have a saved ngrok URL
      if (isLocalhost && !isNgrok && !localStorage.getItem("ngrok_url")) {
        setShow(true);
      }
    }
  }, []);

  if (!show || !ngrokInfo) return null;

  return (
    <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-4">
      <div className="flex items-start">
        <div className="shrink-0">
          <svg
            className="h-5 w-5 text-amber-400"
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
          <p className="text-sm text-amber-700">
            <strong>Important:</strong> The D-ID API requires a publicly
            accessible URL, but you&apos;re currently using {ngrokInfo.origin}.
            <br />
            Please run ngrok with:{" "}
            <code className="bg-amber-50 px-1 rounded-sm">ngrok http 3000</code>,
            then visit that ngrok URL.
            <br />
            <Link
              href="/diagnostic"
              className="mt-2 font-medium underline inline-block"
            >
              Run diagnostics & troubleshooting
            </Link>
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => setShow(false)}
              className="inline-flex rounded-md p-1.5 text-amber-500 hover:bg-amber-200 focus:outline-hidden"
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
