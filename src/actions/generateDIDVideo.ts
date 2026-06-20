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
  webhookUrl: string | null,
  inputText?: string,
  voiceId?: string,
  audioUrl?: string,
  elevenlabsApiKey?: string,
  emotion: Emotion = "neutral",
  movement: Movement = "neutral",
  basicAuth: string | null = null
): Promise<GenerateVideoSuccessResponse | GenerateVideoFailResponse> {
  await protect();

  console.log("generateDIDVideo request started", {
    hasProfileApiKey: !!apiKey,
    hasProfileBasicAuth: !!basicAuth,
    hasProfileElevenLabsKey: !!elevenlabsApiKey,
    hasWebhook: !!webhookUrl,
  });

  // Use environment variables as fallbacks for the API keys
  const finalApiKey = apiKey || process.env.DID_API_KEY || "";
  const finalElevenlabsApiKey =
    elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || "";
  let finalBasicAuth = basicAuth || process.env.D_ID_BASIC_AUTH || "";

  // Check if we have either API key or Basic Auth
  if (!finalApiKey && !finalBasicAuth) {
    console.error(
      "No D-ID authentication available - neither API key nor Basic Auth provided"
    );
    return {
      error:
        "D-ID authentication is missing. Please add either a D-ID API key or Basic Auth in your profile settings.",
    };
  }

  // Skip API key validation if we have Basic Auth
  if (
    !finalBasicAuth &&
    typeof finalApiKey === "string" &&
    finalApiKey.trim() !== "" &&
    !finalApiKey.includes(":") &&
    !finalApiKey.startsWith("Basic ")
  ) {
    console.error(
      "API key format appears to be invalid - missing colon separator"
    );
    return {
      error:
        "D-ID API key format is invalid. It should be in the format 'username:password'. Please check your API key in profile settings.",
    };
  }

  console.log("D-ID credential sources selected", {
    did: apiKey ? "profile" : "environment",
    elevenlabs: elevenlabsApiKey ? "profile" : "environment",
    hasElevenLabsKey: !!finalElevenlabsApiKey,
  });

  // Check if we're using the fallback image
  const isFallbackImage = imageUrl.includes("/assets/headshot_fallback.png");

  // First, test if we can fetch the image - this helps diagnose if the issue is with image accessibility
  // Skip this check if we're using the fallback image
  if (!isFallbackImage) {
    try {
      console.log("Testing if image is accessible...");
      console.log(`Full image URL: ${imageUrl}`);

      // Add more validation of the URL format
      try {
        const imageUrlObj = new URL(imageUrl);
        console.log(`Image URL protocol: ${imageUrlObj.protocol}`);
        console.log(`Image URL host: ${imageUrlObj.host}`);
        console.log(`Image URL pathname: ${imageUrlObj.pathname}`);

        // Check if URL uses HTTPS (D-ID API requires HTTPS)
        if (imageUrlObj.protocol !== "https:") {
          console.warn(
            "Image URL doesn't use HTTPS - D-ID API requires HTTPS URLs"
          );
        }
      } catch (urlError) {
        console.error("Invalid image URL format:", urlError);
        return {
          error: `Invalid image URL format: ${imageUrl}. Please use a valid HTTPS URL.`,
        };
      }

      // Method 1: HEAD request (faster but less reliable)
      try {
        const headResponse = await fetch(imageUrl, {
          method: "HEAD",
          headers: { Accept: "image/*" },
        });

        if (headResponse.ok) {
          console.log("Image URL is accessible via HEAD request ✓");
          console.log(`HEAD response status: ${headResponse.status}`);
          console.log(
            `HEAD response headers: ${JSON.stringify([
              ...headResponse.headers.entries(),
            ])}`
          );
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

    // Determine script settings based on available inputs
    if (audioUrl) {
      console.log("Audio URL provided. Using pre-recorded audio.");
      scriptSettings = {
        type: "audio",
        url: audioUrl,
      };
    } else if (voiceId && inputText) {
      console.log("Voice ID and script provided. Using text-to-speech.");
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

    // Configure the authorization header based on available authentication methods
    let authHeader = "";

    if (finalBasicAuth) {
      // If it doesn't start with Basic but looks like it should
      if (!finalBasicAuth.startsWith("Basic ") && finalBasicAuth.length > 20) {
        finalBasicAuth = `Basic ${finalBasicAuth.replace(/^Basic\s+/i, "")}`;
      }
    }

    if (finalApiKey && finalApiKey.length > 1) {
      console.log("Using DID API Key for authentication");

      // Check if it's already in Basic format
      if (finalApiKey.startsWith("Basic ")) {
        authHeader = finalApiKey;
      }
      // Check if it looks like raw credentials (username:password)
      else if (finalApiKey.includes(":")) {
        console.log("Converting raw credentials to Basic auth format");
        // Convert raw credentials to basic auth format
        const base64Credentials = Buffer.from(finalApiKey).toString("base64");
        authHeader = `Basic ${base64Credentials}`;
      }
      // Assume it's already base64 encoded but missing the "Basic " prefix
      else {
        console.log("Adding Basic prefix to credentials");
        authHeader = `Basic ${finalApiKey}`;
      }
    } else if (finalBasicAuth && finalBasicAuth.length > 1) {
      console.log("Using DID Basic Auth for authentication");

      // Check if finalBasicAuth already has the "Basic " prefix
      if (finalBasicAuth.startsWith("Basic ")) {
        authHeader = finalBasicAuth;
      } else {
        // Check if it looks like raw credentials (username:password)
        if (finalBasicAuth.includes(":")) {
          console.log("Converting raw credentials to Basic auth format");
          // Convert raw credentials to basic auth format
          const base64Credentials =
            Buffer.from(finalBasicAuth).toString("base64");
          authHeader = `Basic ${base64Credentials}`;
        } else {
          // Assume it's already base64 encoded but missing the "Basic " prefix
          console.log("Adding Basic prefix to credentials");
          authHeader = `Basic ${finalBasicAuth}`;
        }
      }
    } else {
      const errorMessage =
        "No valid authentication method provided. Please check your profile settings.";
      console.error(errorMessage);
      return {
        error: errorMessage,
      } as GenerateVideoFailResponse;
    }

    // Add validation to ensure the authHeader is properly formatted
    if (!authHeader) {
      console.error("FATAL ERROR: Authorization header is empty");
      return {
        error:
          "Authentication error: Authorization header could not be constructed. Please check your API key or Basic Auth.",
      };
    }

    // Also validate and fix finalBasicAuth directly
    if (finalBasicAuth && !finalBasicAuth.startsWith("Basic ")) {
      finalBasicAuth = `Basic ${finalBasicAuth.replace(/^Basic\s+/i, "")}`;
    }

    if (!authHeader.startsWith("Basic ")) {
      console.error("Malformed authorization header generated");

      // Attempt to fix the header if possible
      if (authHeader.includes(":")) {
        authHeader = `Basic ${Buffer.from(authHeader).toString("base64")}`;
      } else if (!/^[A-Za-z0-9+/=]+$/.test(authHeader)) {
        console.error("Header is not valid Base64, cannot fix automatically");

        // Last-ditch fallback: try to use finalBasicAuth directly if it looks valid
        if (finalBasicAuth && finalBasicAuth.startsWith("Basic ")) {
          authHeader = finalBasicAuth;
        } else {
          return {
            error:
              "Authentication error: Invalid authorization format. Please check your API key or Basic Auth format.",
          };
        }
      } else {
        authHeader = `Basic ${authHeader}`;
      }
    }

    const talkPayload: DIDTalkRequestData = {
      script: scriptSettings as DIDTalkRequestData["script"],
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
    };

    if (webhookUrl) {
      talkPayload.webhook = webhookUrl;
      console.log("Registering D-ID webhook for status updates.");
    } else {
      console.log(
        "No public webhook URL available — client will poll for status updates"
      );
    }

    const config = {
      method: "post",
      url: "https://api.d-id.com/talks",
      headers: {
        accept: "application/json",
        authorization: authHeader,
        "content-type": "application/json",
        "x-api-key-external": JSON.stringify({
          elevenlabs: finalElevenlabsApiKey,
        }),
      },
      data: talkPayload,
    };

    // Test D-ID API key by first making a GET request to check authentication
    try {
      console.log("Testing D-ID API authentication first...");
      console.log("Auth test endpoint: https://api.d-id.com/talks?limit=1");

      const testResponse = await axios.get(
        "https://api.d-id.com/talks?limit=1",
        {
          headers: {
            accept: "application/json",
            authorization: authHeader,
          },
        }
      );
      console.log(
        `Authentication test successful: ${testResponse.status} ${testResponse.statusText}`
      );
    } catch (authError) {
      console.error(
        "Authentication test failed:",
        authError instanceof Error ? authError.message : String(authError)
      );

      // Enhanced error reporting for auth failures
      let authErrorDetails = "Unknown authentication error";
      if (axios.isAxiosError(authError) && authError.response) {
        const status = authError.response.status;
        const responseData = JSON.stringify(authError.response.data, null, 2);

        console.error(`Auth test failed with status: ${status}`);
        console.error(`Auth test response data: ${responseData}`);

        if (status === 401) {
          authErrorDetails =
            "Invalid credentials (Unauthorized). Please check your API key format.";
        } else if (status === 403) {
          authErrorDetails =
            "Access forbidden. Your API key may not have sufficient permissions.";
        } else {
          authErrorDetails = `Status ${status}: ${authError.message}`;
        }
      }

      return {
        error: `D-ID API authentication failed: ${authErrorDetails}. Please check your API key or Basic Auth in profile settings.`,
      };
    }

    console.log("D-ID video request prepared", {
      hasAudioUrl: !!audioUrl,
      hasInputText: !!inputText,
      hasWebhook: !!webhookUrl,
    });

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
          "kind" in error.response.data
        ) {
          // Handle specific error types from D-ID API
          if (error.response.data.kind === "TextToSpeechProviderError") {
            errorMessage =
              "Text to speech provider error. Please check the elevenlabs key, input text or voice ID.";
          } else if (error.response.data.kind === "ValidationError") {
            errorMessage =
              "Something went wrong while validating your video generation request.";
          } else if (error.response.data.kind === "CelebrityDetectedError") {
            // Specific handling for celebrity detection
            console.log("Celebrity detected in image:", error.response.data);

            let celebrityName = "unknown";
            if (error.response.data.details?.celebrity) {
              celebrityName = error.response.data.details.celebrity;
            }

            errorMessage = `D-ID has detected a celebrity in your image (${celebrityName}). D-ID does not allow using images of celebrities for ethical reasons. Please use a different image without celebrities.`;
          } else {
            // Generic error message for other error kinds
            errorMessage = `D-ID API error: ${error.response.data.kind}. ${
              error.response.data.description || ""
            }`;
          }
        }
      } else if (error.request) {
        console.error("No response received from D-ID API");
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
