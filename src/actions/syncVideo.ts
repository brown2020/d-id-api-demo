"use server";

import { DIDVideoStatus, Emotion, Movement } from "@/types/did";
import { auth } from "@clerk/nextjs/server";
import { generateDIDVideo } from "./generateDIDVideo";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { admin, adminDb } from "@/firebase/firebaseAdmin";
import axios from "axios";
import { addVideoToStorage } from "./addVideoToStorage";


export async function syncVideo(video_id: string, did_video_id: string, status: DIDVideoStatus, result_url: string) {

    // Get video data from Firestore
    // D_ID video id should match with video data
    // Upload video to bucket

    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(video_id);
    const video = await videoRef.get();

    if (!video.exists || video.data() == undefined) { return { "error": "Video not found" }; }

    const videoData = video.data();

    // D_ID video id should match with video data
    if (videoData == undefined || videoData.did_id !== did_video_id) { return { "error": "Video ID mismatch" }; }

    // Download video from result_url and upload that video to firebase storage
    // Stream the video from the URL directly to Firebase Storage
    console.log("Downloading video from D-ID API result URL:", result_url);

    if(status !== 'done') { return { "error": "Video processing not completed" }; }

    const addVideoResponse = await addVideoToStorage(video_id, result_url, status);
    if(addVideoResponse.status) return { status: true, video_url: addVideoResponse.video_url };
    else return { "error": "Error adding video to storage" };
}