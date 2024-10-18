"use client";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function VideoDetail() {
    const params = useParams();
    const [videoID, setVideoID] = useState<string | null>(null);

    useEffect(() => {
        setVideoID(params.id.toString());
    }, [params])

    const loadVideo = () => {
        // Load video with ID
        // check video url exist
        // if not exist, call fetch video api only if video type is "personal"
        // if exist, show video
    }

    return <div>Video Detail page: {videoID}</div>
}