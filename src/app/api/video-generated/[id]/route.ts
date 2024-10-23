import { NextRequest } from "next/server";
import { adminDb } from "@/firebase/firebaseAdmin";
import { NOTIFICATION_COLLECTION, NOTIFICATION_STATUS, NOTIFICATION_TYPE, VIDEO_COLLECTION } from "@/libs/constants";
import { addVideoToStorage } from "@/actions/addVideoToStorage";
import { addWebhookToHistory } from "@/actions/addWebhookToHistory";
import moment from "moment";


export const POST = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const newParams = await params;

    const { method, headers, url } = req;

    // Parse the URL to get the query parameters
    const { searchParams } = new URL(url);

    // Construct the base cURL command
    let curlCommand = `curl -X ${method} "${url}"`;

    // Add headers to the cURL command
    headers.forEach((value, key) => {
        curlCommand += ` -H "${key}: ${value}"`;
    });

    // Add query parameters to the URL (if any)
    if (Array.from(searchParams).length > 0) {
        curlCommand = `curl -X ${method} "${url}"`;
    }

    const rawBody = await req.text();

    // Add the body to the cURL command if the request has one
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        if (rawBody) {
            curlCommand += ` -d '${rawBody}'`;
        }
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    let requestBody: Record<string, any> = {};
    if (headers.get('content-type')?.includes('application/json')) {
        requestBody = JSON.parse(rawBody);
    }

    addWebhookToHistory(curlCommand)

    const process = await new Promise<{ status: true } | { error: string }>(async (resolve) => {
        try {
            // Add request to history

            const { id } = newParams;

            // Get token from from query params
            const token = req.nextUrl.searchParams.get("token");
            if (!token) {
                resolve({ "error": "Token is required" });
                return;
            }

            const body = requestBody;

            // Find video by ID
            const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
            const video = await videoRef.get();
            const videoData = video.data();

            if (videoData == undefined || !video.exists || video.data() == undefined) { resolve({ "error": "Video not found" }); return; }

            // Send response if video already exist
            if (videoData.video_url) {
                resolve({ error: "Video already exist" });
                return;
            }

            // Authenticate request with secret key
            // Get secret key from videoData
            const secret_token = videoData.secret_token;
            if (secret_token !== token) { resolve({ "error": "Unauthorized" }); return; }

            // D_ID video id should match with video data
            // Get d id video id from request
            const did_video_id = body.id;
            if (videoData == undefined || videoData.did_id !== did_video_id) { resolve({ "error": "Video ID mismatch" }); return; }


            // Find video url from request
            const result_url = body.result_url;

            // Get status from request
            const status = body.status;

            // Download video from result_url and upload that video to firebase storage
            const addVideoResponse = await addVideoToStorage(id, result_url, status);
            if (addVideoResponse.status) {

                // Add new notification to notification collection
                
                const notificationRef = adminDb.collection(NOTIFICATION_COLLECTION);
                await notificationRef.add({
                    type: NOTIFICATION_TYPE.VIDEO_GENERATED,
                    status: NOTIFICATION_STATUS.UNREAD,
                    video_id: id,
                    user_id: videoData.owner,
                    created_at: moment().format('X'),
                })


                resolve({ status: true });
            } else {
                resolve({ "error": "Error adding video to storage" })
            }

            return;
        } catch (error) {
            console.log("Error sharing document:", error);
            resolve({ error: "Failed to save document" });
        }
    })

    if ("error" in process) {
        return new Response(process.error, { status: 400 });
    } else {
        return new Response("Video added successfully", { status: 200 });
    }

};