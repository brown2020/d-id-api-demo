import { CanvasObjects } from "@/types/did";
import { AUDIO_LIST } from "./constants";

export function getAudioDetails(audio_id: string) {
  return AUDIO_LIST.find((audio) => audio.voice_id === audio_id);
}

export function randomString(n: number) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < n; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export const getApiBaseUrl = () => {
  // If we're in the browser
  if (typeof window !== "undefined") {
    const origin = window.location.origin;

    // If this is an ngrok URL, automatically save it for future use
    if (origin.includes("ngrok.io") || origin.includes("ngrok-free.app")) {
      // Save this ngrok URL for server-side rendering when on localhost
      localStorage.setItem("ngrok_url", origin);
      return origin;
    }

    // For localhost development, check if we have saved ngrok URL
    if (origin.includes("localhost")) {
      const savedNgrokUrl = localStorage.getItem("ngrok_url");
      if (savedNgrokUrl) {
        return savedNgrokUrl;
      }
    }

    // If environment variable exists, use it as a fallback
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL;
    }

    return origin;
  }

  // Server-side rendering - use environment variable or default
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
};

// Function to save ngrok URL to localStorage
export const saveNgrokUrl = (url: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("ngrok_url", url);
  }
};

export const imageProxyUrl = (baseUrl: string, image: string) =>
  `${baseUrl}/api/imageproxy/${image}`;
export const videoImageProxyUrl = (baseUrl: string, image: string) =>
  `${baseUrl}/api/video-image-proxy/${encodeURIComponent(image)}`;
export const getWebhookUrl = (
  baseUrl: string,
  id: string,
  secret_token: string
) => `${baseUrl}/api/video-generated/${id}?token=${secret_token}`;

export const checkCanvasObjectImageDomain = (fabricJSON: CanvasObjects) => {
  // If image url is from different domain, then replace it with proxy url
  const newOrigin = new URL(getApiBaseUrl());
  return fabricJSON.map((obj) => {
    if ("src" in obj && obj.src) {
      // Check src is valid url
      try {
        const srcUrl = new URL(obj.src);
        srcUrl.protocol = newOrigin.protocol;
        srcUrl.host = newOrigin.host;
        obj.src = srcUrl.toString();
      } catch (error) {
        console.log("srcUrl", error);
      }
    }
    return obj;
  });
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const cleanObject = (obj: Record<string, any>) => {
  // Iterate over each key in the object
  Object.keys(obj).forEach((key) => {
    // If the value is null or undefined, delete the key
    if (obj[key] === null || obj[key] === undefined) {
      delete obj[key];
    } else if (typeof obj[key] === "object" && Array.isArray(obj[key])) {
      // If the value is an array, remove any null or undefined values from it
      obj[key] = obj[key].map((item: any) => {
        if (typeof item === "object") {
          return cleanObject(item);
        }
        return item;
      });
    } else if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      // If the value is an object, recursively clean it
      cleanObject(obj[key]);
    }
  });

  // Return the cleaned object
  return obj;
};
