"use server";

import { Emotion, Movement } from "@/types/did";
import { auth } from "@clerk/nextjs/server";
import { generateDIDVideo } from "./generateDIDVideo";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function generateVideo(apiKey: string | null,
    imageUrl: string,
    avatar_id: string,
    inputText?: string,
    voiceId?: string,
    audioUrl?: string,
    elevenlabsApiKey?: string,
    emotion: Emotion = "neutral",
    movement: Movement = "neutral",
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

    if (response) {

        if(!response.error){
            const id = `new-video-${Date.now()}`;
    
            const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
            await videoRef.set({
                id,
                did_id: response.id,
                avatar_id: avatar_id,
                owner: userId,
                type: 'personal',
                video_url: '',
            }, { merge: true });
            return {
                status: true,
                id: id
            }
        }
        return { status: false, message: response.error || 'Error generating video' };
    }

    return { status: false, message: 'Error generating video' };

}