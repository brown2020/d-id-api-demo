"use server";

import { Emotion, Movement } from "@/types/did";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

interface GenerateVideoResponse {
  id: string;
  error?: string;
}

export async function generateDIDVideo(
  apiKey: string,
  imageUrl: string,
  inputText?: string,
  voiceId?: string,
  audioUrl?: string,
  elevenlabsApiKey?: string,
  emotion: Emotion = "natural",
  movement: Movement = "natural"
): Promise<GenerateVideoResponse | null> {
  auth().protect();



  console.log("Starting generateDIDVideo function with parameters:", {
    apiKey: apiKey ? "provided" : "not provided",
    imageUrl,
    inputText,
    voiceId,
    audioUrl,
    elevenlabsApiKey: elevenlabsApiKey ? "provided" : "not provided",
  });

  if (!apiKey && process.env.D_ID_API_KEY !== undefined) {
    apiKey = process.env.D_ID_API_KEY
  }
  if (!elevenlabsApiKey && process.env.ELEVENLABS_API_KEY !== undefined) {
    elevenlabsApiKey = process.env.ELEVENLABS_API_KEY
  }

  try {
    let scriptSettings;

    // Determine script settings based on available inputs
    if (audioUrl) {
      console.log("Audio URL provided. Using pre-recorded audio:", audioUrl);
      scriptSettings = {
        type: "audio",
        url: audioUrl,
      };
    } else if (voiceId && inputText) {
      console.log("Voice ID and script provided. Using text-to-speech:", {
        voiceId,
        inputText,
      });
      scriptSettings = {
        type: "text",
        input: inputText,
        provider: {
          type: "elevenlabs",
          voice_id: voiceId,
        },
      };
    } else {
      console.log("No audio or script provided. Defaulting to silent video");
      scriptSettings = {
        type: "text",
        input: "Hello, this is a silent example",
      };
    }

    console.log("Script settings configured:", scriptSettings);

    const config = {
      method: "post",
      url: "https://api.d-id.com/talks",
      headers: {
        "x-api-key-external": JSON.stringify({
          elevenlabs: elevenlabsApiKey, // Use the passed in ElevenLabs API key
        }),
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      data: {
        script: scriptSettings,
        source_url: imageUrl,
        config: {
          stitch: true,
          "driver_expressions": {
            "expressions": [
              {
                "expression": emotion,
                "start_frame": 0,
                "intensity": movement == 'lively' ? 1 : 0.5
              },
            ]
          }
        },
      },
    };

    console.log(
      "Axios request config prepared:",
      JSON.stringify(config, null, 2)
    );

    const response = await axios.request(config);

    console.log(
      "Response received from D-ID API:",
      response.status,
      response.statusText
    );

    if (response.status === 429) {
      console.warn("API rate limit exceeded. Please try again later.");
      return {
        id: "",
        error: "Rate limit exceeded. Please try again later.",
      };
    }

    if (response.status >= 400) {
      console.error("API request failed with status:", response.status);
      console.error("Error response data:", response.data);
      return {
        id: "",
        error: `Failed with status ${response.status}: ${response.statusText}`,
      };
    }

    const id = response.data?.id;
    if (!id) {
      console.error("No ID found in API response data:", response.data);
      return {
        id: "",
        error: "Failed to retrieve ID from the response. Please try again.",
      };
    }

    console.log("Video generation successful. Video ID:", id);
    return { id };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Error during video generation:", error.message);

      if (error.response) {
        console.error("Error response from API:", {
          status: error.response.status,
          data: error.response.data,
        });

        if (error.response.status === 429) {
          return {
            id: "",
            error: "Rate limit exceeded. Please try again later.",
          };
        }
      } else if (error.request) {
        console.error(
          "No response received from API. Error request data:",
          error.request
        );
      } else {
        console.error("Unexpected error during API call:", error.message);
      }
    } else if (error instanceof Error) {
      console.error("Unexpected error occurred:", error.message);
    } else {
      console.error("An unknown error occurred.");
    }

    return {
      id: "",
      error:
        "An error occurred while generating the video. Make sure you have entered valid API keys in your profile and try again. If you are running on localhost, make sure you use ngrok to expose your local server to the internet.",
    };
  }
}
