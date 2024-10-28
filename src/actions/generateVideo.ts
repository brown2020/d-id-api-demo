"use server";

import { Emotion, Movement } from "@/types/did";
import { auth } from "@clerk/nextjs/server";
import { generateDIDVideo } from "./generateDIDVideo";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";
import { getWebhookUrl, imageProxyUrl, randomString } from "@/libs/utils";

export async function generateVideo(apiKey: string | null,
    baseUrl: string,
    extraDetail: { thumbnail_url: string },
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

    const id = `new-video-${Date.now()}`;
    const secret_token = randomString(32);
    const imageUrl = imageProxyUrl(baseUrl, `${avatar_id}.png`);
    const webhookUrl = getWebhookUrl(baseUrl, id, secret_token);
    const response = await generateDIDVideo(
        apiKey,
        imageUrl,
        webhookUrl,
        inputText,
        voiceId,
        audioUrl,
        elevenlabsApiKey,
        emotion,
        movement,
    )

    if (response) {
        if ("error" in response && response.error) {
            return { status: false, message: response.error || 'Error generating video' }
        } else if ("id" in response) {

            const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);

            await videoRef.set({
                id,
                title: "Untitled Video",
                did_id: response.id,
                d_id_status: response.status,
                avatar_id: avatar_id,
                owner: userId,
                type: 'personal',
                video_url: '',
                thumbnail_url: extraDetail.thumbnail_url,
                secret_token
            }, { merge: true });
            return {
                status: true,
                id: id
            }
        }
        return { status: false, message: 'Error generating video' };
    }

    return { status: false, message: 'Error generating video' };

}