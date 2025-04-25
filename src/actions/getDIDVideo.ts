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
    // Use profile API key or fall back to environment variable
    const finalApiKey = d_id_api_key || process.env.D_ID_API_KEY || "";

    // Log API key format for debugging
    console.log(
      "getDIDVideo API Key format:",
      finalApiKey
        ? `Length: ${
            finalApiKey.length
          }, Contains colon: ${finalApiKey.includes(":")}`
        : "API Key is null"
    );

    // Use environment variable auth or construct from API key
    const authorization =
      process.env.D_ID_BASIC_AUTH ||
      (finalApiKey
        ? finalApiKey.includes(":")
          ? `Basic ${Buffer.from(finalApiKey).toString("base64")}`
          : `Basic ${finalApiKey}`
        : "");

    // Check if we have valid authorization
    if (!authorization) {
      console.error("No authorization available for D-ID API");
      return {
        error:
          "Missing D-ID API credentials. Please check your API key in profile settings.",
      };
    }

    console.log("Using authorization for D-ID API request");

    const videoResponse = await axios.get<GetVideoSuccessResponse>(
      `https://api.d-id.com/talks/${videoId}`,
      {
        headers: {
          accept: "application/json",
          authorization: authorization,
        },
      }
    );

    return videoResponse.data;
  } catch (error) {
    console.error("Error getting video from D-ID:", error);
    return { error: "Error getting video from D-ID" };
  }
}
