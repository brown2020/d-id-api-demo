import { CanvasObjects } from "../types/did";
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
  // If we're in the browser, always use the current window location
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side rendering - use environment variable or default
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
};

// This function is no longer used but keeping it for backward compatibility
export const saveNgrokUrl = () => {
  // This is now a no-op as we always use window.location.origin
  console.log(
    "saveNgrokUrl is deprecated, using window.location.origin instead"
  );
};

export const imageProxyUrl = (baseUrl: string, image: string) =>
  `${baseUrl}/api/imageproxy/${image}`;
export const videoImageProxyUrl = (baseUrl: string, image: string) =>
  `${baseUrl}/api/video-image-proxy/${encodeURIComponent(image)}`;
export const getWebhookUrl = (
  baseUrl: string,
  id: string,
  secret_token: string
) => {
  // Always use a dummy webhook URL to force polling
  // This ensures consistent behavior across all environments
  return `https://webhook.site/${id}?token=${secret_token}`;
};

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
      obj[key] = obj[key].map((item: Record<string, unknown>) => {
        if (typeof item === "object" && item !== null) {
          return cleanObject(item as Record<string, any>);
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
