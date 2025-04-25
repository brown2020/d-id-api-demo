import { NextResponse } from "next/server";
import { protect } from "../../../actions/auth";

export async function GET() {
  try {
    await protect();

    // Get the D-ID API key from environment variables for comparison
    const envApiKey = process.env.D_ID_API_KEY || "";

    // Check if environment variables are set
    const diagnostics = {
      d_id_api_key: {
        exists: !!process.env.D_ID_API_KEY,
        length: envApiKey.length,
        format: {
          contains_colon: envApiKey.includes(":"),
          starts_with_basic: envApiKey.startsWith("Basic "),
          appears_valid:
            envApiKey.includes(":") || envApiKey.startsWith("Basic "),
        },
      },
      elevenlabs_api_key: {
        exists: !!process.env.ELEVENLABS_API_KEY,
        length: process.env.ELEVENLABS_API_KEY?.length || 0,
      },
      d_id_basic_auth: {
        exists: !!process.env.D_ID_BASIC_AUTH,
        length: process.env.D_ID_BASIC_AUTH?.length || 0,
        starts_with_basic:
          process.env.D_ID_BASIC_AUTH?.startsWith("Basic ") || false,
      },
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
      },
    };

    return NextResponse.json({
      diagnostics,
      recommendations: [
        diagnostics.d_id_api_key.exists
          ? "✅ D-ID API key is set in environment variables"
          : "❌ D-ID API key is missing from environment variables",

        diagnostics.d_id_api_key.format.appears_valid
          ? "✅ D-ID API key format appears valid"
          : "❌ D-ID API key format appears invalid - should contain a colon (:) or start with 'Basic '",

        diagnostics.elevenlabs_api_key.exists
          ? "✅ ElevenLabs API key is set"
          : "⚠️ ElevenLabs API key is not set (optional)",
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in key diagnostics:", error);
    return NextResponse.json(
      {
        error: "Authentication required",
        message: "You must be logged in to view API key diagnostics",
      },
      { status: 401 }
    );
  }
}
