"use client";
import { db } from "@/firebase/firebaseClient";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { VideoDetail as VideoDetailType } from "@/types/did";
import { collection, doc, onSnapshot, query } from "firebase/firestore";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function VideoDetail() {
    const params = useParams();
    const [videoID, setVideoID] = useState<string | null>(null);
    const [videoData, setVideoData] = useState<VideoDetailType | null>(null);
    const [notFound, setNotFound] = useState<boolean>(false);

    useEffect(() => {
        setVideoID(params.id.toString());
    }, [params])

    useEffect(() => {
        if (videoID === null) return;

        const docRef = doc(db, VIDEO_COLLECTION, videoID);

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (!snapshot.exists()) {
                setNotFound(true)
            } else {
                loadVideo(snapshot.data() as VideoDetailType);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [videoID])

    const loadVideo = (video: VideoDetailType) => {
        // Load video with ID
        setVideoData(video);

        // check video url exist
        if (!video.video_url) {
            // show video
        }
        // if not exist, call fetch video api only if video type is "personal"
        // if exist, show video
    }

    return <div>Video Detail page: {videoID}</div>
}