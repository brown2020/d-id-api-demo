"use server";

import { DIDVideoStatus, Emotion, Movement } from "../types/did";
import { protect } from "./auth";
import axios from "axios";
import { addErrorReport } from "./addErrorReport";

export type GenerateVideoSuccessResponse = {
  id: string;
  status: DIDVideoStatus;
};

export type GenerateVideoFailResponse = {
  error: string;
};

export async function generateDIDVideo(
  apiKey: string | null,
  imageUrl: string,
  webhookUrl: string,
  inputText?: string,
  voiceId?: string,
  audioUrl?: string,
  elevenlabsApiKey?: string,
  emotion: Emotion = "neutral",
  movement: Movement = "neutral"
): Promise<GenerateVideoSuccessResponse | GenerateVideoFailResponse> {
  await protect();

  // Add these logs at the start of the function to help debug the issue
  console.log("generateDIDVideo called with:");
  console.log(`- Image URL: ${imageUrl}`);
  console.log(`- Webhook URL: ${webhookUrl}`);
  console.log(`- API Key present: ${!!apiKey}`);
  console.log(`- ElevenLabs API Key present: ${!!elevenlabsApiKey}`);

  if (!apiKey && process.env.D_ID_API_KEY !== undefined) {
    apiKey = process.env.D_ID_API_KEY;
  }
  if (!elevenlabsApiKey && process.env.ELEVENLABS_API_KEY !== undefined) {
    elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  }

  // Check if we're using the fallback image
  const isFallbackImage = imageUrl.includes("/assets/headshot_fallback.png");

  // First, test if we can fetch the image - this helps diagnose if the issue is with image accessibility
  // Skip this check if we're using the fallback image
  if (!isFallbackImage) {
    try {
      console.log("Testing if image is accessible...");

      // Method 1: HEAD request (faster but less reliable)
      try {
        const headResponse = await fetch(imageUrl, {
          method: "HEAD",
          headers: { Accept: "image/*" },
        });

        if (headResponse.ok) {
          console.log("Image URL is accessible via HEAD request ✓");
        } else {
          console.log(
            `HEAD request failed with status ${headResponse.status}, trying GET request...`
          );

          // Method 2: GET request (more reliable, fallback)
          const getResponse = await fetch(imageUrl, {
            method: "GET",
            headers: { Accept: "image/*" },
          });

          if (!getResponse.ok) {
            console.error(
              `Image URL isn't accessible: GET request failed with status ${getResponse.status}`
            );
            return {
              error: `The image URL is not accessible (status ${getResponse.status}).`,
            };
          } else {
            console.log("Image URL is accessible via GET request ✓");
          }
        }
      } catch (headError) {
        console.error("HEAD request failed, trying GET request...", headError);

        // Fallback to GET request
        try {
          const getResponse = await fetch(imageUrl);
          if (!getResponse.ok) {
            console.error(
              `Image URL isn't accessible: GET request failed with status ${getResponse.status}`
            );
            return {
              error: `The image URL is not accessible.`,
            };
          } else {
            console.log("Image URL is accessible via GET request ✓");
          }
        } catch (getError) {
          console.error(
            "Error testing image accessibility with GET:",
            getError
          );
          return {
            error: `Failed to access the image URL: ${
              getError instanceof Error ? getError.message : String(getError)
            }.`,
          };
        }
      }
    } catch (imgError) {
      console.error("Error testing image accessibility:", imgError);
      return {
        error: `Failed to verify image accessibility: ${
          imgError instanceof Error ? imgError.message : String(imgError)
        }. Make sure the image URL is publicly accessible.`,
      };
    }
  } else {
    console.log("Using fallback image - skipping accessibility check ✓");
  }

  try {
    let scriptSettings;

    // Add this diagnostic check for environment variables
    console.log("Environment variables check:");
    console.log(`- D_ID_BASIC_AUTH set: ${!!process.env.D_ID_BASIC_AUTH}`);
    console.log(`- D_ID_API_KEY set: ${!!process.env.D_ID_API_KEY}`);
    console.log(
      `- ELEVENLABS_API_KEY set: ${!!process.env.ELEVENLABS_API_KEY}`
    );

    // Add check for the actual API key passed in (without revealing it)
    console.log(
      `- API Key passed to function: ${
        apiKey ? `Present (${apiKey.length} chars)` : "Not present"
      }`
    );

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

    // Log API key format for debugging (without revealing the actual key)
    console.log(
      "API Key format check:",
      apiKey
        ? `Length: ${apiKey.length}, Contains colon: ${apiKey.includes(":")}`
        : "API Key is null"
    );

    // Use the authorization from environment variable
    console.log("Using authorization from environment variable");

    // Define a more specific type for the data object
    interface DIDTalkRequestData {
      script: {
        type: "audio" | "text";
        url?: string;
        input?: string;
        provider?: {
          type: string;
          voice_id: string;
        };
      };
      source_url: string;
      webhook?: string; // Optional webhook property
      config: {
        stitch: boolean;
        driver_expressions: {
          expressions: {
            expression: Emotion;
            start_frame: number;
            intensity: number;
          }[];
        };
      };
    }

    const config = {
      method: "post",
      url: "https://api.d-id.com/talks",
      headers: {
        accept: "application/json",
        authorization:
          process.env.D_ID_BASIC_AUTH || (apiKey ? `Basic ${apiKey}` : ""),
        "content-type": "application/json",
        "x-api-key-external": JSON.stringify({
          elevenlabs: elevenlabsApiKey, // Use the passed in ElevenLabs API key
        }),
      },
      data: {
        script: scriptSettings,
        source_url: imageUrl,
        config: {
          stitch: true,
          driver_expressions: {
            expressions: [
              {
                expression: emotion,
                start_frame: 0,
                intensity: movement == "lively" ? 1 : 0.5,
              },
            ],
          },
        },
      } as DIDTalkRequestData, // Use a specific type instead of 'any'
    };

    // Debug the auth header for troubleshooting (without revealing the full value)
    const authHeader = config.headers.authorization;
    console.log(`Authorization header length: ${authHeader.length}`);
    console.log(
      `Authorization header starts with: ${authHeader.substring(0, 10)}...`
    );
    console.log(
      `Authorization header format is valid: ${authHeader.startsWith("Basic ")}`
    );

    // Always skip webhook URLs and use polling instead
    console.log("Skipping webhook URL - using polling for status updates");

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
        error: "Rate limit exceeded. Please try again later.",
      };
    }

    if (response.status >= 400) {
      console.error("API request failed with status:", response.status);
      console.error("Error response data:", response.data);
      return {
        error: `Failed with status ${response.status}: ${response.statusText}`,
      };
    }

    const id = response.data?.id;
    const status = response.data?.status;
    if (!id) {
      console.error("No ID found in API response data:", response.data);
      return {
        error: "Failed to retrieve ID from the response. Please try again.",
      };
    }

    console.log("Video generation successful. Video ID:", id);
    return { id, status };
  } catch (error: unknown) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let errorDetails: Record<string, any> = {};

    // Handle known types of error
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack || null,
      };
    } else {
      // For unknown errors
      errorDetails = {
        message: "Unknown error occurred",
        raw: JSON.stringify(error), // Serialize the raw error
      };
    }

    let errorMessage: string = "";

    if (axios.isAxiosError(error)) {
      console.error("Error during video generation:", error.message);

      if (error.response) {
        const responseError = {
          status: error.response.status,
          data: JSON.stringify(error.response.data, null, 2),
        };
        console.error("Error response from API:", responseError);
        errorDetails["responseError"] = responseError;

        if (error.response.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (error.response.status === 402) {
          errorMessage =
            "Your account is out of credits. Please add more credits to generate video.";
        } else if (error.response.status === 500) {
          // Check if this might be an image issue
          console.log(
            "Received 500 error - checking if this might be an image issue"
          );
          errorMessage =
            "D-ID server error. This may be due to an issue with the image URL or server load. Please try again or use a different image.";
        } else if (
          typeof error.response.data === "object" &&
          "kind" in error.response.data &&
          error.response.data.kind == "TextToSpeechProviderError"
        ) {
          errorMessage =
            "Text to speech provider error. Please check the elevenlabs key, input text or voice ID.";
        } else if (
          typeof error.response.data === "object" &&
          "kind" in error.response.data &&
          error.response.data.kind == "ValidationError"
        ) {
          /**
           * TODO: Send Error Report
           * Message: Issue with validation of the request
           * Data: JSON.stringify(error.response.data, null, 2)
           */
          errorMessage =
            "Something went wrong, while requesting your generate video.";
        }

        // Add additional checks for specific error patterns
        if (error.response.data && typeof error.response.data === "object") {
          if (
            error.response.data.kind === "ValidationError" &&
            error.response.data.message &&
            error.response.data.message.includes("source_url")
          ) {
            console.error(
              "Image URL validation error - the D-ID API can't access the image URL"
            );
            errorMessage =
              "The D-ID API cannot access the image. Please try with a different public image URL.";
          }

          // Log more detailed error data
          console.error(
            "Detailed error data:",
            JSON.stringify(error.response.data, null, 2)
          );
        }
      } else if (error.request) {
        console.error(
          "No response received from API. Error request data:",
          error.request
        );
        errorMessage =
          "Cannot connect to D-ID API. Please check your internet connection and firewall settings.";
      } else {
        console.error("Unexpected error during API call:", error.message);
      }
    } else if (error instanceof Error) {
      console.error("Unexpected error occurred:", error.message);
    } else {
      console.error("An unknown error occurred.");
    }
    await addErrorReport("generateDIDVideo", errorDetails);

    // Last fallback error message
    return {
      error:
        errorMessage ||
        `An error occurred while generating the video. Please check your API keys in your profile settings.`,
    };
  }
}
