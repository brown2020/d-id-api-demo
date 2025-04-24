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

    // Use the authorization from environment variable
    console.log("Using authorization from environment variable");

    const videoResponse = await axios.get<GetVideoSuccessResponse>(
      `https://api.d-id.com/talks/${videoId}`,
      {
        headers: {
          accept: "application/json",
          authorization: process.env.D_ID_BASIC_AUTH || "",
        },
      }
    );

    return videoResponse.data;
  } catch (error) {
    console.error("Error getting video from D-ID:", error);
    return { error: "Error getting video from D-ID" };
  }
}
