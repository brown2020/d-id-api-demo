"use server";

import { DIDVideoStatus } from "@/types/did";
import axios from "axios";

interface GetVideoSuccessResponse {
  id: string;
  status: DIDVideoStatus;
  result_url: string;
  errorDetails?: Record<string, unknown>;
  errorMessage?: string;
}

export async function getDIDVideo(d_id_api_key: string, videoId: string) {
  try {
    // Log API key format for debugging
    console.log(
      "getDIDVideo API Key format:",
      d_id_api_key
        ? `Length: ${
            d_id_api_key.length
          }, Contains colon: ${d_id_api_key.includes(":")}`
        : "API Key is null"
    );

    // Use the exact header from the working curl command
    console.log("Using exact authorization header from working curl command");

    const videoResponse = await axios.get<GetVideoSuccessResponse>(
      `https://api.d-id.com/talks/${videoId}`,
      {
        headers: {
          accept: "application/json",
          authorization:
            "Basic WW5KdmQyNHlNREl3UUdkdFlXbHNMbU52YlE6emNjYm9IeXh4aHNxZm1lVjhibFVi",
        },
      }
    );

    return videoResponse.data;
  } catch (error) {
    console.error("Error getting video from D-ID:", error);
    return { error: "Error getting video from D-ID" };
  }
}
