"use server";

import { requireAuth } from "@/actions/auth";
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
    await requireAuth();

    const finalApiKey = d_id_api_key.trim();
    const authorization = finalApiKey
      ? finalApiKey.startsWith("Basic ")
        ? finalApiKey
        : finalApiKey.includes(":")
          ? `Basic ${Buffer.from(finalApiKey).toString("base64")}`
          : `Basic ${finalApiKey}`
      : "";

    // Check if we have valid authorization
    if (!authorization) {
      return {
        error:
          "Missing D-ID API credentials. Please check your API key in profile settings.",
      };
    }


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
  } catch {
    return { error: "Error getting video from D-ID" };
  }
}
