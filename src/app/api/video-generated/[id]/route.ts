import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import fs from "fs";
import path from "path";
import { File } from "buffer";
import { adminDb } from "@/firebase/firebaseAdmin";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { addVideoToStorage } from "@/actions/addVideoToStorage";
import { NextApiRequest } from "next";


export const POST = async (req: NextApiRequest, { params }: { params: { id: string } }) => {
    const { method, headers, body } = req;
    const _method = method ? method.toUpperCase() : 'GET';

    // Construct the cURL command
    let curlCommand = `curl -X ${method} "${req.headers.host}${req.url}"`;

    // Add headers to the cURL command
    for (const [key, value] of Object.entries(headers)) {
        curlCommand += ` -H "${key}: ${value}"`;
    }
    let bodyData = null;
    if (['POST', 'PUT', 'PATCH'].includes(_method.toUpperCase())) {
        // Assume the body is in JSON format and parse it
        bodyData = await new Promise((resolve, reject) => {
          let data = '';
          req.on('data', (chunk) => {
            data += chunk;
          });
          req.on('end', () => {
            resolve(data);
          });
          req.on('error', (err) => {
            reject(err);
          });
        });
      }

    // Respond with the cURL command
    return NextResponse.json({ data: curlCommand }, { status: 200 });
    const process = await new Promise<{ status: true } | { error: string }>(async (resolve, reject) => {
        try {
            // Add request to history

            const { id } = params;

            // Get token from from query params
            const { searchParams } = new URL(req.url);
            const token = req.nextUrl.searchParams.get("token");
            if (!token) {
                resolve({ "error": "Token is required" });
                return;
            }

            // console.log("Request:", req.url);
            // console.log("Request:", req);
            // console.log("Request req.body:", req);
            const body = await req.json();

            // Find video by ID
            const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
            const video = await videoRef.get();
            const videoData = video.data();

            if (videoData == undefined || !video.exists || video.data() == undefined) { resolve({ "error": "Video not found" }); return; }

            // Send response if video already exist
            // if (videoData.video_url) {
            //     resolve({ error: "Video already exist" });
            //     return;
            // }

            // Authenticate request with secret key
            // Get secret key from videoData
            const secret_key = videoData.secret_key;
            if (secret_key !== token) { resolve({ "error": "Unauthorized" }); return; }

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
            if (addVideoResponse.status) resolve({ status: true });
            else resolve({ "error": "Error adding video to storage" });

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