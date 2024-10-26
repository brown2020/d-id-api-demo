'use client'

import { useEffect, useState } from "react"
import { db } from "@/firebase/firebaseClient"
import { collection, DocumentData, getDocs } from 'firebase/firestore';
import { Loader } from "./Loader";
import PlayVideoIcon from '@/assets/images/play-video-1.png'
import Image from "next/image";

export default function VideosPage() {

    const [fetching, setFetching] = useState<boolean>(false);
    const [videoList, setVideoList] = useState<DocumentData[]>([]);

    useEffect(() => {
        getVideoList()
    }, [])

    const getVideoList = async () => {
        setFetching(true);
        const docRef = collection(db, 'generated-videos');
        const snapshot = await getDocs(docRef);
        const videoList = snapshot.docs.map(doc => doc.data());
        setVideoList(videoList);
        console.log(videoList);

        setFetching(false);
    }

    return (
        <>
            {
                fetching ? <Loader /> :
                    <div className="p-4">
                        <h3 className="mb-3 text-lg font-semibold text-gray-600">My Videos</h3>
                        <div className="grid grid-cols-12 gap-x-2 gap-y-3">
                            {
                                videoList.map((video, index) => {
                                    return (
                                        <div key={index} className="col-span-3 cursor-pointer group/video relative border-1 p-4 hover:bg-black border-gray-300 hover:drop-shadow-2xl rounded-xl overflow-hidden hover:-translate-y-2 transition-all duration-300">
                                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/0 transition-all duration-300 hover:via-gray-900/1"></div>
                                            <div className="h-36"></div>
                                            <Image src={PlayVideoIcon} alt="Audio play image" width={60} height={60} className="flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/video:w-20 group-hover/video:h-20 transition-all duration-300 object-contain justify-center items-center" />
                                            <div className="z-10 relative text-white">
                                                <h1 className="font-bold text-xl">{video.title}</h1>
                                                <p className="font-semibold text-lg">{video.type}</p>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
            }
        </>
    )
}