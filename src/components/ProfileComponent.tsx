"use client";

import useProfileStore from "@/zustand/useProfileStore";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProfileComponent() {
  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const [didApiKey, setDidApiKey] = useState(profile.did_api_key);
  const [didBasicAuth, setDidBasicAuth] = useState(profile.did_basic_auth);
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState(
    profile.elevenlabs_api_key
  );

  useEffect(() => {
    setDidApiKey(profile.did_api_key);
    setDidBasicAuth(profile.did_basic_auth);
    setElevenlabsApiKey(profile.elevenlabs_api_key);
  }, [profile.did_api_key, profile.did_basic_auth, profile.elevenlabs_api_key]);

  const handleApiKeyChange = async () => {
    if (
      didApiKey !== profile.did_api_key ||
      didBasicAuth !== profile.did_basic_auth ||
      elevenlabsApiKey !== profile.elevenlabs_api_key
    ) {
      try {
        // Validate Basic Auth format
        let finalBasicAuth = didBasicAuth?.trim() || "";

        // If basic auth is provided, ensure it has the "Basic " prefix
        if (finalBasicAuth && !finalBasicAuth.startsWith("Basic ")) {
          if (finalBasicAuth.includes(":")) {
            // If it's in username:password format, convert to proper Basic Auth
            const base64Credentials =
              Buffer.from(finalBasicAuth).toString("base64");
            finalBasicAuth = `Basic ${base64Credentials}`;
          } else if (/^[A-Za-z0-9+/=]+$/.test(finalBasicAuth)) {
            // If it looks like base64 already, just add the prefix
            finalBasicAuth = `Basic ${finalBasicAuth}`;
          }
          // Update the form data with the corrected value
          setDidBasicAuth(finalBasicAuth);
        }

        await updateProfile({
          did_api_key: didApiKey,
          did_basic_auth: finalBasicAuth,
          elevenlabs_api_key: elevenlabsApiKey,
        });
        console.log("API keys updated successfully!");
      } catch (error) {
        console.error("Error updating API keys:", error);
      }
    }
  };

  return (
    <div className="flex flex-col p-5 border rounded-[10px] shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px]">
      {/* <div className="flex flex-col sm:flex-row px-5 py-3 gap-3 border border-gray-500 rounded-md">
        <div className="flex gap-2 w-full items-center">
          <div className="flex-1">
            Credits Available: {Math.round(profile.credits)}
          </div>
          <Link
            className="bg-blue-500 text-white px-3 py-2 rounded-md hover:opacity-50 flex-1 text-center"
            href={"/payment-attempt"}
          >
            Buy 10,000 Credits
          </Link>
        </div>
      </div> */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col">
          <label
            htmlFor="did-api-key"
            className="text-base font-light mb-[5px]"
          >
            D-ID API Key:
          </label>
          <input
            type="text"
            id="did-api-key"
            value={didApiKey}
            onChange={(e) => setDidApiKey(e.target.value)}
            className="border bg-ghostWhite text-mediumGray rounded-md py-[10px] px-[15px] h-10 text-sm"
            placeholder="Enter your D-ID API Key (username:password format)"
          />
          <div className="mt-1 text-xs text-gray-500">
            Format: username:password from the D-ID dashboard
          </div>
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="did-basic-auth"
            className="text-base font-light mb-[5px]"
          >
            D-ID Basic Auth:
            <span className="ml-1 font-bold text-green-600 text-xs">
              (Recommended for production)
            </span>
          </label>
          <input
            type="text"
            id="did-basic-auth"
            value={didBasicAuth}
            onChange={(e) => setDidBasicAuth(e.target.value)}
            className="border bg-ghostWhite text-mediumGray rounded-md py-[10px] px-[15px] h-10 text-sm"
            placeholder="Enter your D-ID Basic Auth (starts with 'Basic ')"
          />
          <div className="mt-1 text-xs text-gray-500">
            Format: Basic [base64-encoded-credentials] -
            <Link
              href="/basic-auth-generator"
              className="text-blue-500 underline ml-1"
            >
              Use the generator
            </Link>
          </div>
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="elevenlabs-api-key"
            className="text-base font-light mb-[5px]"
          >
            ElevenLabs API Key:
          </label>
          <input
            type="text"
            id="elevenlabs-api-key"
            value={elevenlabsApiKey}
            onChange={(e) => setElevenlabsApiKey(e.target.value)}
            className="border bg-ghostWhite text-mediumGray rounded-md py-[10px] px-[15px] h-10 text-sm"
            placeholder="Enter your ElevenLabs API Key"
          />
        </div>
        <button
          onClick={handleApiKeyChange}
          disabled={
            didApiKey === profile.did_api_key &&
            didBasicAuth === profile.did_basic_auth &&
            elevenlabsApiKey === profile.elevenlabs_api_key
          }
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:opacity-50 disabled:opacity-50"
        >
          Update API Keys
        </button>
      </div>
    </div>
  );
}
