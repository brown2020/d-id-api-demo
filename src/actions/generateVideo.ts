"use server";

import { Emotion, Movement } from "@/types/did";
import { auth } from "@clerk/nextjs/server";
import { generateDIDVideo } from "./generateDIDVideo";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function generateVideo(apiKey: string | null,
    imageUrl: string,
    inputText?: string,
    voiceId?: string,
    audioUrl?: string,
    elevenlabsApiKey?: string,
    emotion: Emotion = "neutral",
    movement: Movement = "neutral"
) {
    auth().protect();
    const { userId } = auth();

    const response = await generateDIDVideo(
        apiKey,
        imageUrl,
        inputText,
        voiceId,
        audioUrl,
        elevenlabsApiKey,
        emotion,
        movement
    )

    if (response && !response.error) {
        const id = `new-video-${Date.now()}`;

        const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
        await videoRef.set({
            did_id: response.id,
            video_url: ''
        }, { merge: true });
        return {
            status: true,
            id: id
        }
    }

    return { status: false }

}