"use server";

import { ExpressiveVideoDetail } from "@/types/did";
import { resolveDidCredentials } from "@/libs/did-demo";
import { requireAuth } from "./auth";
import { adminDb } from "@/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import {
  debitVideoGenerationCredits,
  refundVideoGenerationCredits,
} from "@/server/video-credits";

const EXPRESSIVE_VIDEOS_COLLECTION = "expressive-videos";

async function saveDemoExpressiveSample(
  videoRef: FirebaseFirestore.DocumentReference,
  reason: "missing_key" | "auth" | "credits" | "quota"
) {
  const demoNotices = {
    missing_key: "Demo mode: No D-ID API key configured. Add your key in Profile to create real videos.",
    auth: "Demo mode: D-ID authentication failed. Please check your API key in Profile.",
    credits: "Demo mode: Insufficient D-ID credits. Please add credits to your D-ID account.",
    quota: "Demo mode: D-ID quota exceeded. Please check your D-ID account limits.",
  };

  await videoRef.update({
    status: "done",
    result_url: "/demo/sample-talking-avatar.mp4",
    thumbnail_url: "/demo/sample-talking-avatar.png",
    demo_mode: true,
    demo_notice: demoNotices[reason],
    errorMessage: null,
    updated_at: Timestamp.now(),
  });
}

export async function createExpressiveVideo(
  avatarId: string,
  sentimentId: string,
  scriptText: string,
  apiKey: string | null,
  basicAuth: string | null
): Promise<{
  status: boolean;
  videoId?: string;
  message?: string;
}> {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : "Authentication required",
    };
  }

  const videoId = `exp-video-${Date.now()}`;
  let charged = false;

  try {
    const videoRef = adminDb.collection(EXPRESSIVE_VIDEOS_COLLECTION).doc(videoId);

    await videoRef.set({
      id: videoId,
      owner: userId,
      avatar_id: avatarId,
      sentiment_id: sentimentId,
      script_text: scriptText,
      status: "created",
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      demo_mode: false,
    });

    const credentials = resolveDidCredentials(apiKey, basicAuth);

    if (!credentials) {
      await saveDemoExpressiveSample(videoRef, "missing_key");
      return {
        status: true,
        videoId,
        message: "Demo video created (no API key)",
      };
    }

    const creditResult = await debitVideoGenerationCredits(userId);
    if (!creditResult.ok) {
      await saveDemoExpressiveSample(videoRef, "credits");
      return {
        status: true,
        videoId,
        message: "Demo video created (insufficient credits)",
      };
    }
    charged = true;

    const url = "https://api.d-id.com/expressives";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar_id: avatarId,
        sentiment_id: sentimentId,
        script: {
          type: "text",
          input: scriptText,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("D-ID expressive API error:", response.status, errorText);

      if (charged) {
        await refundVideoGenerationCredits(userId);
      }

      if (response.status === 401 || response.status === 403) {
        await saveDemoExpressiveSample(videoRef, "auth");
        return {
          status: true,
          videoId,
          message: "Demo video created (authentication failed)",
        };
      }

      if (response.status === 402 || errorText.toLowerCase().includes("credit")) {
        await saveDemoExpressiveSample(videoRef, "credits");
        return {
          status: true,
          videoId,
          message: "Demo video created (D-ID credits insufficient)",
        };
      }

      if (response.status === 429 || errorText.toLowerCase().includes("quota")) {
        await saveDemoExpressiveSample(videoRef, "quota");
        return {
          status: true,
          videoId,
          message: "Demo video created (quota exceeded)",
        };
      }

      await videoRef.update({
        status: "error",
        errorMessage: `D-ID API error: ${response.status}`,
        updated_at: Timestamp.now(),
      });

      return {
        status: false,
        message: `Failed to create video: ${response.status}`,
        videoId,
      };
    }

    const data = await response.json();

    await videoRef.update({
      did_expressive_id: data.id,
      status: data.status || "created",
      updated_at: Timestamp.now(),
    });

    return {
      status: true,
      videoId,
      message: "Video generation started",
    };
  } catch (error) {
    console.error("Error creating expressive video:", error);

    if (charged) {
      await refundVideoGenerationCredits(userId);
    }

    return {
      status: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getExpressiveVideo(
  expressiveId: string,
  apiKey: string | null,
  basicAuth: string | null
): Promise<{
  status: boolean;
  video?: ExpressiveVideoDetail;
  message?: string;
}> {
  try {
    const credentials = resolveDidCredentials(apiKey, basicAuth);

    if (!credentials) {
      return {
        status: false,
        message: "D-ID API key required",
      };
    }

    const url = `https://api.d-id.com/expressives/${expressiveId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        status: false,
        message: `Failed to fetch video: ${response.status}`,
      };
    }

    const video: ExpressiveVideoDetail = await response.json();

    return {
      status: true,
      video,
    };
  } catch (error) {
    console.error("Error getting expressive video:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function syncExpressiveVideo(videoId: string): Promise<{
  status: boolean;
  message?: string;
}> {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : "Authentication required",
    };
  }

  try {
    const videoRef = adminDb.collection(EXPRESSIVE_VIDEOS_COLLECTION).doc(videoId);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      return { status: false, message: "Video not found" };
    }

    const videoData = videoDoc.data();
    if (!videoData || videoData.owner !== userId) {
      return { status: false, message: "Unauthorized" };
    }

    if (videoData.demo_mode) {
      return { status: true, message: "Demo video (no sync needed)" };
    }

    if (!videoData.did_expressive_id) {
      return { status: false, message: "No D-ID video ID" };
    }

    const result = await getExpressiveVideo(
      videoData.did_expressive_id,
      null,
      null
    );

    if (!result.status || !result.video) {
      return { status: false, message: result.message || "Failed to fetch from D-ID" };
    }

    const updates: Record<string, unknown> = {
      status: result.video.status,
      updated_at: Timestamp.now(),
    };

    if (result.video.result_url) {
      updates.result_url = result.video.result_url;
    }

    if (result.video.duration) {
      updates.duration = result.video.duration;
    }

    if (result.video.status === "error") {
      updates.errorMessage = "Video generation failed";
    }

    await videoRef.update(updates);

    return { status: true, message: "Video synced" };
  } catch (error) {
    console.error("Error syncing expressive video:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function listUserExpressiveVideos(): Promise<{
  status: boolean;
  videos?: ExpressiveVideoDetail[];
  message?: string;
}> {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : "Authentication required",
    };
  }

  try {
    const snapshot = await adminDb
      .collection(EXPRESSIVE_VIDEOS_COLLECTION)
      .where("owner", "==", userId)
      .orderBy("created_at", "desc")
      .limit(50)
      .get();

    const videos: ExpressiveVideoDetail[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id || doc.id,
        object: "expressive",
        status: data.status || "created",
        avatar_id: data.avatar_id || "",
        sentiment_id: data.sentiment_id || "",
        result_url: data.result_url,
        duration: data.duration,
        created_at: data.created_at?.toDate().toISOString() || new Date().toISOString(),
        owner: data.owner,
        thumbnail_url: data.thumbnail_url,
        errorMessage: data.errorMessage,
        script_text: data.script_text,
        demo_mode: data.demo_mode || false,
        demo_notice: data.demo_notice,
      };
    });

    return {
      status: true,
      videos,
    };
  } catch (error) {
    console.error("Error listing user expressive videos:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
