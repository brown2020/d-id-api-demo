"use client";
import { getVideo } from "@/actions/getVideo";
import { db } from "@/firebase/firebaseClient";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { DIDVideoStatus, VideoDetail as VideoDetailType } from "@/types/did";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function VideoDetail() {
    const params = useParams();
    const uid = useAuthStore((state) => state.uid);
    const profile = useProfileStore((state) => state.profile);
    const [videoID, setVideoID] = useState<string | null>(null);
    const [videoData, setVideoData] = useState<VideoDetailType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [generating, setGenerating] = useState<boolean>(true);
    const [videoStatus, setVideoStatus] = useState<DIDVideoStatus | null>(null);

    useEffect(() => {
        setVideoID(params.id.toString());
    }, [params])

    useEffect(() => {
        if (videoID === null || !uid) return;

        const docRef = doc(collection(db, VIDEO_COLLECTION), videoID);
        setLoading(true);
        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            setLoading(false);
            if (!snapshot.exists()) {
                notFound()
            } else {
                loadVideo(snapshot.data() as VideoDetailType);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [videoID, uid])

    const loadVideo = async (video: VideoDetailType) => {
        console.log("set video data", video);

        // Load video with ID
        setVideoData(video);
        if (video.d_id_status === "done" && videoStatus !== null && videoStatus !== video.d_id_status) {
            toast.success("Video generated successfully", { duration: 7000 });
        }

        // check video url exist
        if (!video.video_url) {
            // show video
            setGenerating(true);
            const response = await getVideo(profile.did_api_key, video.id)
            console.log("response", response);

        } else {
            setGenerating(false);
        }
        // if not exist, call fetch video api only if video type is "personal"
        // if exist, show video
    }

    return <div className="p-4 bg-white h-full rounded shadow-md">
        {videoData ?
            <div className="h-full">
                <h2 className="text-2xl font-bold">{videoData.title ?? "Untitled Video"}</h2>

                {
                    generating ? <div className="flex items-center justify-center h-full">
                        <h2 className="text-2xl font-bold animate-pulse">Generating video...</h2>
                    </div> : <div className="h-full flex items-center justify-center">
                        <video controls src={videoData.video_url} className="h-4/5"></video>
                    </div>
                }
            </div>
            : <div className="h-full">
                <h2 className="text-2xl font-bold animate-pulse">{loading ? "Fetching video..." : ""}</h2>

                <div>

                </div>
            </div>}
    </div>
}