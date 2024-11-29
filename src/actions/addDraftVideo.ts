"use server";

import { CanvasObject } from "@/types/did";
import { auth } from "@clerk/nextjs/server";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";

export async function addDraftVideo( 
    canvas_object: CanvasObject,
    canvas_detail: {
        height: number;
        width: number;
        aspectRatio: number;
    },
    avatar_id: string
) {
    auth().protect();
    const { userId } = auth();
    
    const id = `new-video-${Date.now()}`;

    // add that thumbnail id to video object
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
    await videoRef.set({
        id,
        title: "Untitled Video",
        did_id: '',
        d_id_status: '',
        avatar_id: avatar_id,
        owner: userId,
        type: 'personal',
        canvas_json: canvas_object,
        canvas_detail: canvas_detail,
    }, { merge: true });

    return {
        status: true,
        id: id
    }
}