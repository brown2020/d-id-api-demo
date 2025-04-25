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
  movement: Movement = "neutral",
  basicAuth: string | null = null
): Promise<GenerateVideoSuccessResponse | GenerateVideoFailResponse> {
  await protect();

  // Detailed logging for authentication debugging
  console.log("=== AUTHENTICATION DEBUG INFO ===");
  console.log(`- API Key provided: ${!!apiKey}`);
  console.log(`- API Key length: ${apiKey?.length || 0}`);
  console.log(`- Basic Auth provided: ${!!basicAuth}`);
  console.log(`- Basic Auth length: ${basicAuth?.length || 0}`);
  if (basicAuth) {
    console.log(
      `- Basic Auth starts with 'Basic ': ${basicAuth.startsWith("Basic ")}`
    );
    console.log(
      `- Basic Auth format: ${
        basicAuth.startsWith("Basic ") ? "Correct" : "Needs prefix"
      }`
    );
  }
  console.log("=================================");

  // Add these logs at the start of the function to help debug the issue
  console.log("generateDIDVideo called with:");
  console.log(`- Image URL: ${imageUrl}`);
  console.log(`- Webhook URL: ${webhookUrl}`);
  console.log(`- API Key present: ${!!apiKey}`);
  console.log(`- Basic Auth present: ${!!basicAuth}`);
  console.log(`- ElevenLabs API Key present: ${!!elevenlabsApiKey}`);

  // Add more detailed raw data debugging for production issues
  console.log("=========== RAW AUTH DATA BEFORE PROCESSING ===========");
  // Log API Key details (safely)
  if (apiKey) {
    console.log(`- API Key type: ${typeof apiKey}`);
    console.log(`- API Key length: ${apiKey.length}`);
    console.log(`- API Key starts with: ${apiKey.substring(0, 5)}...`);
    console.log(`- API Key includes colon: ${apiKey.includes(":")}`);
    console.log(
      `- API Key starts with 'Basic ': ${apiKey.startsWith("Basic ")}`
    );
  } else {
    console.log("- API Key is null or empty");
  }

  // Log Basic Auth details (safely)
  if (basicAuth) {
    console.log(`- Basic Auth type: ${typeof basicAuth}`);
    console.log(`- Basic Auth length: ${basicAuth.length}`);
    console.log(`- Basic Auth starts with: ${basicAuth.substring(0, 10)}...`);
    console.log(
      `- Basic Auth starts with 'Basic ': ${basicAuth.startsWith("Basic ")}`
    );
  } else {
    console.log("- Basic Auth is null or empty");
  }
  console.log("=====================================================");

  // Add more detailed debug for production issues
  console.log("=========== PRODUCTION DEBUG ===========");
  console.log(`- Runtime environment: ${process.env.NODE_ENV}`);
  console.log(`- API Key from param length: ${apiKey ? apiKey.length : 0}`);
  console.log(
    `- Basic Auth from param length: ${basicAuth ? basicAuth.length : 0}`
  );
  console.log(`- D_ID_API_KEY exists: ${!!process.env.D_ID_API_KEY}`);
  console.log(`- D_ID_BASIC_AUTH exists: ${!!process.env.D_ID_BASIC_AUTH}`);
  console.log("=======================================");

  // Use environment variables as fallbacks for the API keys
  const finalApiKey = apiKey || process.env.D_ID_API_KEY || "";
  const finalElevenlabsApiKey =
    elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || "";
  const finalBasicAuth = basicAuth || process.env.D_ID_BASIC_AUTH || "";

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

  console.log(
    `API key type check: ${typeof finalApiKey}, length: ${finalApiKey.length}`
  );
  console.log(
    `Basic Auth type check: ${typeof finalBasicAuth}, length: ${
      finalBasicAuth.length
    }`
  );

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

  // Log which API keys we're using (without revealing the actual values)
  console.log("Using API keys:");
  console.log(
    `- D-ID API Key: ${
      finalApiKey
        ? "Using from " + (apiKey ? "profile" : "environment")
        : "Missing"
    }`
  );
  console.log(
    `- ElevenLabs API Key: ${
      finalElevenlabsApiKey
        ? "Using from " + (elevenlabsApiKey ? "profile" : "environment")
        : "Missing"
    }`
  );

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
        finalApiKey ? `Present (${finalApiKey.length} chars)` : "Not present"
      }`
    );

    // Add detailed diagnostic check for environment variables format
    console.log(`D_ID_BASIC_AUTH environment variable check:`);
    console.log(`- Exists: ${!!process.env.D_ID_BASIC_AUTH}`);
    if (process.env.D_ID_BASIC_AUTH) {
      console.log(`- Length: ${process.env.D_ID_BASIC_AUTH.length}`);
      console.log(
        `- Starts with 'Basic ': ${process.env.D_ID_BASIC_AUTH.startsWith(
          "Basic "
        )}`
      );
    }

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
      finalApiKey
        ? `Length: ${
            finalApiKey.length
          }, Contains colon: ${finalApiKey.includes(":")}`
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

    // Configure the authorization header based on available authentication methods
    let authHeader = "";
    if (finalApiKey && finalApiKey.length > 1) {
      console.log("Using DID API Key for authentication");
      authHeader = finalApiKey;
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

    console.log("======================================");

    console.log(
      "Authorization header set:",
      authHeader.substring(0, 10) + "..."
    );

    // Add validation to ensure the authHeader is properly formatted
    if (!authHeader) {
      console.error("FATAL ERROR: Authorization header is empty");
      return {
        error:
          "Authentication error: Authorization header could not be constructed. Please check your API key or Basic Auth.",
      };
    }

    if (!authHeader.startsWith("Basic ")) {
      console.error(
        `MALFORMED AUTH HEADER: Header doesn't start with "Basic ": ${authHeader.substring(
          0,
          20
        )}...`
      );
      // Attempt to fix the header if possible
      if (authHeader.includes(":")) {
        console.log("Attempting to fix header by encoding as Base64");
        authHeader = `Basic ${Buffer.from(authHeader).toString("base64")}`;
      } else if (!/^[A-Za-z0-9+/=]+$/.test(authHeader)) {
        console.error("Header is not valid Base64, cannot fix automatically");
        return {
          error:
            "Authentication error: Invalid authorization format. Please check your API key or Basic Auth format.",
        };
      } else {
        console.log(
          "Header appears to be Base64 but missing 'Basic ' prefix, adding prefix"
        );
        authHeader = `Basic ${authHeader}`;
      }
      console.log(
        "Fixed authorization header:",
        authHeader.substring(0, 10) + "..."
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
      } as DIDTalkRequestData,
    };

    // Test D-ID API key by first making a GET request to check authentication
    try {
      console.log("Testing D-ID API authentication first...");
      console.log("Auth test endpoint: https://api.d-id.com/talks?limit=1");
      console.log("Auth test header:", authHeader.substring(0, 10) + "...");

      // Log the full request details for debugging
      const testRequest = {
        method: "GET",
        url: "https://api.d-id.com/talks?limit=1",
        headers: {
          accept: "application/json",
          authorization: authHeader,
        },
      };
      console.log(
        "Auth test request config:",
        JSON.stringify(testRequest, null, 2)
      );

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
      console.log(
        "Auth test response headers:",
        JSON.stringify(testResponse.headers)
      );
    } catch (authError) {
      console.error("Authentication test failed:", authError);

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
