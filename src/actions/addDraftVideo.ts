"use server";

import { CanvasObject } from "../types/did";
import { protect } from "./auth";
import { VIDEO_COLLECTION } from "../libs/constants";
import { adminDb } from "../firebase/firebaseAdmin";

export async function addDraftVideo(
  canvas_object: CanvasObject,
  canvas_detail: {
    height: number;
    width: number;
    aspectRatio: number;
  },
  avatar_id: string
) {
  try {
    // Get user ID from the auth check
    const userId = await protect();

    const id = `new-video-${Date.now()}`;

    // add that thumbnail id to video object
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
    await videoRef.set(
      {
        id,
        title: "Untitled Video",
        did_id: "",
        d_id_status: "",
        avatar_id: avatar_id,
        owner: userId,
        type: "personal",
        canvas_json: canvas_object,
        canvas_detail: canvas_detail,
        created_at: new Date().getTime(),
      },
      { merge: true }
    );

    return {
      status: true,
      id: id,
    };
  } catch (error) {
    console.error("Error adding draft video:", error);
    return {
      status: false,
      message:
        error instanceof Error ? error.message : "Error adding draft video",
      id: null,
    };
  }
}
